CREATE INDEX IF NOT EXISTS `idx_admins_username` ON `admins` (`username`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_articles_is_delete_update_date` ON `articles` (`is_delete`,`update_date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_articles_is_delete_category_update_date` ON `articles` (`is_delete`,`category`,`update_date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_articles_is_delete_category_visit` ON `articles` (`is_delete`,`category`,`visit`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_categories_cate_order` ON `categories` (`cate_order`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_comments_article_id_is_delete` ON `comments` (`article_id`,`is_delete`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_comments_userid` ON `comments` (`userid`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_genealogy_parent` ON `genealogy` (`parent`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_likes_user_id` ON `likes` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_users_email` ON `users` (`email`);
