import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  getRouteName,
  shouldShowBreadcrumbs,
  HIDDEN_SEGMENTS,
} from "../shared/constants/routes";
import { useBreadcrumb } from "../contexts/BreadcrumbContext";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { dynamicTitle } = useBreadcrumb();

  // Check if should show breadcrumbs
  if (!shouldShowBreadcrumbs(pathname)) {
    return null;
  }

  const pathnames = pathname.split("/").filter((x) => x);

  // Filter out hidden segments (like "post" in /blog/post/:id)
  const visiblePathnames = pathnames.filter(
    (segment) => !HIDDEN_SEGMENTS.includes(segment.toLowerCase())
  );

  return (
    <nav className="bg-gray-50 border-b" aria-label="Breadcrumb">
      <div className="container mx-auto px-4">
        <ol
          className="flex items-center py-3 text-sm"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {/* Home link */}
          <li
            className="flex items-center"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <Link
              to="/"
              className="text-gray-600 hover:text-emerald-600 flex items-center transition-colors"
              itemProp="item"
            >
              <Home size={16} className="mr-1" aria-hidden="true" />
              <span itemProp="name">Trang chủ</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>

          {/* Dynamic segments */}
          {visiblePathnames.map((segment, index) => {
            // Build route path excluding hidden segments up to current index
            const visibleUpToNow = visiblePathnames.slice(0, index + 1);

            // Reconstruct actual path including hidden segments
            let routeTo = "/";
            let visibleIdx = 0;
            for (const seg of pathnames) {
              routeTo += seg + "/";
              if (!HIDDEN_SEGMENTS.includes(seg.toLowerCase())) {
                if (visibleIdx >= visibleUpToNow.length - 1) break;
                visibleIdx++;
              }
            }
            routeTo = routeTo.replace(/\/$/, ""); // Remove trailing slash

            const isLast = index === visiblePathnames.length - 1;
            const position = index + 2; // Home is 1, so start from 2

            // Get display name - use dynamic title for last segment if it's an ID
            let displayName = getRouteName(segment, routeTo);

            // If displayName is null (numeric ID), use dynamic title or fallback
            if (displayName === null) {
              displayName = isLast && dynamicTitle ? dynamicTitle : "Chi tiết";
            }

            return (
              <li
                key={routeTo}
                className="flex items-center"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <ChevronRight
                  size={16}
                  className="mx-2 text-gray-400"
                  aria-hidden="true"
                />

                {isLast ? (
                  <span
                    className="text-emerald-600 font-medium truncate max-w-[200px]"
                    itemProp="name"
                    aria-current="page"
                    title={displayName}
                  >
                    {displayName}
                  </span>
                ) : (
                  <Link
                    to={routeTo}
                    className="text-gray-600 hover:text-emerald-600 transition-colors"
                    itemProp="item"
                  >
                    <span itemProp="name">{displayName}</span>
                  </Link>
                )}
                <meta itemProp="position" content={String(position)} />
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
