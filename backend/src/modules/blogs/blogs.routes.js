/**
 * Blogs Routes (Supabase)
 */
const express = require("express");
const router = express.Router();
const db = require("../../shared/database/db");
const { generateSlug, isNumericId } = require("../../shared/utils/slug.util");
const {
  authenticateToken,
  requireRole,
} = require("../../shared/middleware/auth.middleware");

// ========================================
// ADMIN ROUTES (must be before public routes)
// ========================================

// Get admin stats for blogs
router.get(
  "/admin/stats",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const supabase = db.getClient();

      // Get total blogs count
      const { count: totalBlogs } = await supabase
        .from("blogs")
        .select("*", { count: "exact", head: true });

      // Get total views
      const { data: viewsData } = await supabase.from("blogs").select("views");
      const totalViews = (viewsData || []).reduce(
        (sum, b) => sum + (b.views || 0),
        0
      );

      // Get total likes
      const { data: likesData } = await supabase.from("blogs").select("likes");
      const totalLikes = (likesData || []).reduce(
        (sum, b) => sum + (b.likes || 0),
        0
      );

      // Get total comments (from reviews table with blog_id)
      const { count: totalComments } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .not("blog_id", "is", null);

      res.json({
        totalBlogs: totalBlogs || 0,
        totalViews: totalViews,
        totalLikes: totalLikes,
        totalComments: totalComments || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Lỗi khi lấy thống kê" });
    }
  }
);

// Get all blogs for admin (with pagination)
router.get(
  "/admin/blogs",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        search,
        category,
        page = 1,
        limit = 10,
        sort_by = "created_desc",
      } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const supabase = db.getClient();

      let query = supabase.from("blogs").select(
        `
        *,
        users:author_id (username, userprofiles (full_name, avatar))
      `,
        { count: "exact" }
      );

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }
      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      // Sorting
      if (sort_by === "created_desc") {
        query = query.order("created_at", { ascending: false });
      } else if (sort_by === "created_asc") {
        query = query.order("created_at", { ascending: true });
      } else if (sort_by === "views_desc") {
        query = query.order("views", { ascending: false });
      }

      const { data, count, error } = await query.range(
        offset,
        offset + parseInt(limit) - 1
      );

      if (error) throw error;

      // Add slug
      const blogsWithSlug = (data || []).map((blog) => ({
        ...blog,
        slug: generateSlug(blog.title) + "-" + blog.id,
      }));

      res.json({
        blogs: blogsWithSlug,
        total: count || 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          total_pages: Math.ceil((count || 0) / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching admin blogs:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách bài viết" });
    }
  }
);

// Get blog categories for admin filters
router.get(
  "/admin/categories",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const supabase = db.getClient();
      const { data, error } = await supabase.from("blogs").select("category");

      if (error) throw error;

      const categories = [
        ...new Set((data || []).map((b) => b.category).filter(Boolean)),
      ];
      res.json({ categories: categories.sort() });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh mục" });
    }
  }
);

// Get blog authors for admin filters
router.get(
  "/admin/authors",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const supabase = db.getClient();
      // Note: blogs table uses author_id, not user_id
      const { data, error } = await supabase
        .from("blogs")
        .select(
          "author_id, users:author_id(username, userprofiles(full_name))"
        );

      if (error) throw error;

      const authorsMap = new Map();
      (data || []).forEach((b) => {
        if (b.author_id && b.users) {
          const userProfile = b.users.userprofiles;
          authorsMap.set(b.author_id, {
            id: b.author_id,
            username: b.users.username || "Unknown",
            full_name: userProfile?.full_name || b.users.username || "Unknown",
          });
        }
      });

      res.json(Array.from(authorsMap.values()));
    } catch (error) {
      console.error("Error fetching authors:", error);
      // Return empty array instead of error to not break UI
      res.json([]);
    }
  }
);

// ========================================
// SPECIFIC ROUTES (before /:id)
// ========================================

// Get featured/latest blogs
router.get("/featured", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("blogs")
      .select(
        `
        *,
        users:author_id (username, userprofiles (full_name, avatar))
      `
      )
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    // Add slug to each blog
    const dataWithSlug = (data || []).map((blog) => ({
      ...blog,
      slug: generateSlug(blog.title) + "-" + blog.id,
    }));

    res.json(dataWithSlug);
  } catch (error) {
    console.error("Error fetching featured blogs:", error);
    res.status(500).json({ error: "Lỗi khi lấy bài viết nổi bật" });
  }
});

// Get blog categories
router.get("/categories", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase.from("blogs").select("category");

    if (error) throw error;

    // Get unique categories
    const categories = [
      ...new Set(data.map((b) => b.category).filter(Boolean)),
    ];
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh mục" });
  }
});

// ========================================
// LIST ROUTES
// ========================================

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const supabase = db.getClient();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from("blogs").select(
      `
        *,
        users:author_id (username, userprofiles (full_name, avatar))
      `,
      { count: "exact" }
    );

    if (category) {
      query = query.eq("category", category);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Optimization: Fetch all comment counts in ONE query instead of N queries
    const blogIds = (data || []).map((blog) => blog.id);

    let commentCountMap = {};
    if (blogIds.length > 0) {
      // Fetch all reviews for these blog IDs in a single query
      const { data: reviews } = await supabase
        .from("reviews")
        .select("blog_id")
        .in("blog_id", blogIds);

      // Count comments by blog_id
      if (reviews) {
        reviews.forEach((review) => {
          commentCountMap[review.blog_id] =
            (commentCountMap[review.blog_id] || 0) + 1;
        });
      }
    }

    // Map comment counts to blogs with slug
    const blogsWithCommentCounts = (data || []).map((blog) => ({
      ...blog,
      comment_count: commentCountMap[blog.id] || 0,
      slug: generateSlug(blog.title) + "-" + blog.id,
    }));

    res.json({ blogs: blogsWithCommentCounts, total: count || 0 });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách bài viết" });
  }
});

// ========================================
// PARAMETERIZED ROUTES
// ========================================

// ========================================
// PARAMETERIZED ROUTES
// ========================================

// Get blog by ID or slug with interaction info
router.get("/:idOrSlug", async (req, res) => {
  try {
    const param = req.params.idOrSlug;
    const userId = req.query.user_id ? parseInt(req.query.user_id) : null;
    const incrementView = req.query.incrementView === "true";

    // Determine if param is ID or slug and extract ID
    let id;
    if (isNumericId(param)) {
      id = parseInt(param);
    } else {
      // Extract ID from slug (format: title-id)
      const slugParts = param.split("-");
      id = parseInt(slugParts[slugParts.length - 1]);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Slug không hợp lệ" });
      }
    }

    const supabase = db.getClient();

    // 1. Fetch Blog Data
    const { data: blog, error } = await supabase
      .from("blogs")
      .select(
        `
        *,
        users:author_id (username, userprofiles (full_name, avatar))
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Bài viết không tồn tại" });
      }
      throw error;
    }

    // 2. Increment Views (if requested)
    if (incrementView) {
      // Async update, don't wait
      supabase
        .from("blogs")
        .update({ views: (blog.views || 0) + 1 })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Error updating views:", error);
        });
    }

    // 3. Fetch Comments (from reviews table)
    // Assuming type 'blog' isn't explicitly in 'reviews' schema as a type, but we use blog_id column.
    const { data: comments, error: commentsError } = await supabase
      .from("reviews")
      .select(
        `
        *,
        users (username, userprofiles (full_name, avatar))
      `
      )
      .eq("blog_id", id)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      // Don't fail the request, just return empty comments
    }

    // 4. Check User Interactions (if logged in)
    let userHasLiked = false;
    let likedCommentIds = [];

    if (userId) {
      // Check blog like
      const { data: likeData } = await supabase
        .from("bloglikes")
        .select("id")
        .eq("blog_id", id)
        .eq("user_id", userId)
        .single();

      userHasLiked = !!likeData;

      // Check comment likes
      if (comments && comments.length > 0) {
        const commentIds = comments.map((c) => c.id);
        const { data: commentLikes } = await supabase
          .from("reviewlikes")
          .select("review_id")
          .in("review_id", commentIds)
          .eq("user_id", userId);

        if (commentLikes) {
          likedCommentIds = commentLikes.map((l) => l.review_id);
        }
      }
    }

    // 5. Structure Response with slug
    const responseData = {
      ...blog,
      comments: comments || [],
      comment_count: comments ? comments.length : 0,
      user_has_liked: userHasLiked,
      liked_comment_ids: likedCommentIds,
      slug: generateSlug(blog.title) + "-" + blog.id,
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ error: "Lỗi khi lấy bài viết" });
  }
});

// Create blog
router.post("/", async (req, res) => {
  try {
    const supabase = db.getClient();
    const { data, error } = await supabase
      .from("blogs")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, message: "Tạo bài viết thành công" });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ error: "Lỗi khi tạo bài viết" });
  }
});

// Update blog
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase
      .from("blogs")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Cập nhật bài viết thành công" });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật bài viết" });
  }
});

// Delete blog
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const supabase = db.getClient();
    const { error } = await supabase.from("blogs").delete().eq("id", id);

    if (error) throw error;
    res.json({ message: "Xóa bài viết thành công" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Lỗi khi xóa bài viết" });
  }
});

// ========================================
// INTERACTION ROUTES
// ========================================

// Add Comment
router.post("/:id/comments", async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    const { user_id, comment, parent_id } = req.body;

    if (!user_id || !comment) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const supabase = db.getClient();

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        blog_id: blogId,
        user_id,
        comment,
        parent_id: parent_id || null,
        rating: 5, // Default rating for blog comments if required check constraint
        status: "active",
      })
      .select(
        `
        *,
        users (username, userprofiles (full_name, avatar))
      `
      )
      .single();

    if (error) throw error;

    // Update comment_count in blogs table (optional, but good for list performance if normalized)
    // Assuming backend triggers handle this or we just count on read.
    // Here we relying on count query on read.

    res.status(201).json({
      message: "Bình luận thành công",
      comment: data,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Lỗi khi gửi bình luận" });
  }
});

// Update Comment
router.put("/:id/comments/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user_id, comment } = req.body;

    const supabase = db.getClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("reviews")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: "Bình luận không tồn tại" });
    }

    if (existing.user_id != user_id) {
      // Note: In real app, check admin role too
      return res.status(403).json({ error: "Không có quyền chỉnh sửa" });
    }

    const { error } = await supabase
      .from("reviews")
      .update({ comment, updated_at: new Date().toISOString() })
      .eq("id", commentId);

    if (error) throw error;

    res.json({ message: "Cập nhật bình luận thành công" });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật bình luận" });
  }
});

// Delete Comment
router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user_id, is_admin } = req.body; // Pass is_admin from frontend or verify token

    const supabase = db.getClient();

    if (!is_admin) {
      // Verify ownership
      const { data: existing } = await supabase
        .from("reviews")
        .select("user_id")
        .eq("id", commentId)
        .single();

      if (!existing) return res.status(404).json({ error: "Not found" });
      if (existing.user_id != user_id)
        return res.status(403).json({ error: "Forbidden" });
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", commentId);

    if (error) throw error;

    res.json({ message: "Xóa bình luận thành công" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Lỗi khi xóa bình luận" });
  }
});

// Like Blog
router.post("/:id/like", async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    const { user_id } = req.body;

    const supabase = db.getClient();

    // Check if already liked
    const { data: existing } = await supabase
      .from("bloglikes")
      .select("id")
      .eq("blog_id", blogId)
      .eq("user_id", user_id)
      .single();

    if (existing) {
      return res.json({
        message: "Đã thích bài viết",
        likes: await getBlogLikes(supabase, blogId),
      });
    }

    // Insert like
    const { error } = await supabase
      .from("bloglikes")
      .insert({ blog_id: blogId, user_id });

    if (error) throw error;

    // Increment likes count
    await supabase.rpc("increment_blog_likes", { row_id: blogId });
    // Or normally just fetch count.
    // Let's manually increment for now if RPC doesn't exist or just update:
    const { data: blog } = await supabase
      .from("blogs")
      .select("likes")
      .eq("id", blogId)
      .single();
    const newLikes = (blog?.likes || 0) + 1;
    await supabase.from("blogs").update({ likes: newLikes }).eq("id", blogId);

    res.json({ message: "Đã thích", likes: newLikes });
  } catch (error) {
    console.error("Error liking blog:", error);
    res.status(500).json({ error: "Lỗi khi thích bài viết" });
  }
});

// Unlike Blog
router.post("/:id/unlike", async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    const { user_id } = req.body;

    const supabase = db.getClient();

    const { error } = await supabase
      .from("bloglikes")
      .delete()
      .eq("blog_id", blogId)
      .eq("user_id", user_id);

    if (error) throw error;

    // Decrement
    const { data: blog } = await supabase
      .from("blogs")
      .select("likes")
      .eq("id", blogId)
      .single();
    const newLikes = Math.max(0, (blog?.likes || 1) - 1);
    await supabase.from("blogs").update({ likes: newLikes }).eq("id", blogId);

    res.json({ message: "Đã bỏ thích", likes: newLikes });
  } catch (error) {
    console.error("Error unliking blog:", error);
    res.status(500).json({ error: "Lỗi khi bỏ thích" });
  }
});

// Like Comment
router.post("/:id/comments/:commentId/like", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user_id } = req.body;
    const supabase = db.getClient();

    // Check if already liked
    const { data: existing } = await supabase
      .from("reviewlikes")
      .select("id")
      .eq("review_id", commentId)
      .eq("user_id", user_id)
      .single();

    if (!existing) {
      await supabase
        .from("reviewlikes")
        .insert({ review_id: commentId, user_id });

      // Update count
      const { data: review } = await supabase
        .from("reviews")
        .select("likes_count")
        .eq("id", commentId)
        .single();
      const newCount = (review?.likes_count || 0) + 1;
      await supabase
        .from("reviews")
        .update({ likes_count: newCount })
        .eq("id", commentId);

      return res.json({ likes: newCount });
    }

    // Get current count
    const { data: review } = await supabase
      .from("reviews")
      .select("likes_count")
      .eq("id", commentId)
      .single();
    res.json({ likes: review?.likes_count || 0 });
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({ error: "Lỗi khi thích bình luận" });
  }
});

// Unlike Comment
router.post("/:id/comments/:commentId/unlike", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user_id } = req.body;
    const supabase = db.getClient();

    await supabase
      .from("reviewlikes")
      .delete()
      .eq("review_id", commentId)
      .eq("user_id", user_id);

    // Update count
    const { data: review } = await supabase
      .from("reviews")
      .select("likes_count")
      .eq("id", commentId)
      .single();
    const newCount = Math.max(0, (review?.likes_count || 1) - 1);
    await supabase
      .from("reviews")
      .update({ likes_count: newCount })
      .eq("id", commentId);

    return res.json({ likes: newCount });
  } catch (error) {
    console.error("Error unliking comment:", error);
    res.status(500).json({ error: "Lỗi khi bỏ thích bình luận" });
  }
});

async function getBlogLikes(supabase, blogId) {
  const { count } = await supabase
    .from("bloglikes")
    .select("*", { count: "exact", head: true })
    .eq("blog_id", blogId);
  return count;
}

module.exports = router;
