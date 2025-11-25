# Community Likes & Comments - Implementation Guide

## ✅ What's Implemented

### Database (Migration)
- **Tables Created:**
  - `post_likes` - Tracks user likes on posts
  - `post_comments` - Comments with nested reply support
  - `comment_likes` - Tracks user likes on comments
  
- **Features:**
  - Automatic counts (likes_count, comments_count) updated via triggers
  - RLS policies for security
  - Indexes for performance
  - Cascading deletes
  - Comment editing with metadata tracking

### Frontend (UI Components)
- **PostCard Component:**
  - Shows real likes and comments counts from database
  
- **Post Detail Screen:**
  - Like/Unlike button with heart icon
  - Real-time like count
  - Comments section with input field
  - Comment submission with loading state
  - Empty state when no comments
  - Comments list with user avatars

### API Functions (lib/db.ts)
- `likePost(postId)` - Like a post
- `unlikePost(postId)` - Unlike a post
- `isPostLikedByMe(postId)` - Check if current user liked
- `getPostLikes(postId)` - Get all likes for a post
- `createComment({postId, content, parentCommentId?})` - Create comment/reply
- `getPostComments(postId)` - Get top-level comments
- `getCommentReplies(parentCommentId)` - Get nested replies
- `updateComment(commentId, content)` - Edit own comment
- `deleteComment(commentId)` - Delete own comment
- `likeComment(commentId)` - Like a comment
- `unlikeComment(commentId)` - Unlike a comment
- `isCommentLikedByMe(commentId)` - Check if current user liked
- `getCommentLikesCount(commentId)` - Get comment like count

## 🚀 How to Deploy

### 1. Run the Migration in Supabase

**Option A: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the contents of `supabase/migrations/20251125_community_likes_comments.sql`
6. Paste into the editor
7. Click **Run** (or press Ctrl+Enter)

**Option B: Via Supabase CLI** (if you have it set up)
```bash
# Navigate to project directory
cd y:\SHack\Algorythm\skillingo

# Run the migration
supabase db push

# Or run specific migration file
supabase db execute --file supabase/migrations/20251125_community_likes_comments.sql
```

### 2. Update TypeScript Types
After running the migration, regenerate the database types:

```bash
npm run supabase:types
```

This will update `types/database.types.ts` with the new tables.

### 3. Restart Your Dev Server
```bash
npm run web
```

## 🧪 Testing the Features

### Test Likes
1. Navigate to Community tab
2. Open any post
3. Click the heart icon to like
4. Count should increase and heart should fill red
5. Click again to unlike
6. Count should decrease and heart should outline

### Test Comments
1. On a post detail page, scroll to comments section
2. Type a comment in the input field
3. Click the send button (blue circle)
4. Comment should appear in the list
5. Verify user info shows correctly

### Test Comment Counts
1. After adding comments, go back to Community feed
2. Post card should show updated comment count
3. Like count should also be visible

## 📊 Database Verification

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('post_likes', 'post_comments', 'comment_likes');

-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'community_posts' 
AND column_name IN ('likes_count', 'comments_count');

-- Test a like (replace YOUR_USER_ID and POST_ID)
INSERT INTO post_likes (post_id, user_id) VALUES (1, 'YOUR_USER_ID');

-- Verify trigger updated count
SELECT id, title, likes_count FROM community_posts WHERE id = 1;
```

## 🎨 UI Flow

### Post Feed (app/(tabs)/two.tsx)
```
[Post Card]
├── Title
├── Content preview
└── Stats: 👤 123 likes, 💬 45 comments
```

### Post Detail (app/community/[postId].tsx)
```
[Post Detail]
├── Full content
├── Actions: ❤️ Like (123) | 💬 Comments (45)
├── [Comment Input Field] ➤ [Send Button]
└── Comments List
    ├── Comment 1 (user avatar, name, time)
    ├── Comment 2
    └── Comment 3
```

## 🔒 Security (RLS Policies)

All tables have Row Level Security enabled:

- **post_likes**: Users can only insert/delete their own likes
- **post_comments**: Users can view comments on approved posts, create/edit/delete their own
- **comment_likes**: Users can only insert/delete their own likes
- **Moderators**: Can delete any comment (policy already in place)

## 🐛 Troubleshooting

### Migration Fails
- **Error**: "relation already exists"
  - Solution: Tables already created, safe to ignore or drop tables first
  
### Counts Not Updating
- **Issue**: Manual INSERT doesn't update counts
  - Solution: Use the provided functions in `lib/db.ts`, they will trigger the count updates

### Comments Not Showing User Info
- **Issue**: `users` field is null
  - Solution: Ensure the user who commented exists in the `users` table (not just `auth.users`)

### TypeScript Errors
- **Issue**: Type errors after migration
  - Solution: Run `npm run supabase:types` to regenerate types

## 🎯 Next Steps (Optional Enhancements)

1. **Nested Replies**: Implement reply-to-comment feature using `parent_comment_id`
2. **Comment Likes**: Add like buttons to individual comments
3. **Edit Comments**: Add edit button (updates `is_edited` flag automatically)
4. **Delete Comments**: Add delete button (moderators already can)
5. **Real-time Updates**: Use Supabase realtime to show new comments instantly
6. **Pagination**: Load comments in batches if many exist
7. **Notifications**: Notify users when someone comments on their post

## 📝 Files Modified

- ✅ `supabase/migrations/20251125_community_likes_comments.sql` - NEW
- ✅ `lib/db.ts` - Added 13 new functions
- ✅ `components/community/PostCard.tsx` - Shows real counts
- ✅ `app/community/[postId].tsx` - Complete likes/comments UI
