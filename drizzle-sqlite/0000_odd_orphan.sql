CREATE TABLE `admins` (
	`_id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`creat_date` text DEFAULT '' NOT NULL,
	`update_date` text DEFAULT '' NOT NULL,
	`is_delete` integer DEFAULT 0 NOT NULL,
	`timestamp` integer
);
--> statement-breakpoint
CREATE INDEX `idx_admins_username` ON `admins` (`username`);--> statement-breakpoint
CREATE TABLE `archive` (
	`c_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`c_title` text,
	`c_intro` text,
	`c_content` text,
	`c_view` integer,
	`c_posttime` text
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`_id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`user_id` text NOT NULL,
	`creat_date` text DEFAULT '' NOT NULL,
	`timestamp` integer
);
--> statement-breakpoint
CREATE INDEX `idx_likes_user_id` ON `likes` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `likes_article_id_user_id_unique` ON `likes` (`article_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `articles` (
	`_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`html` text DEFAULT '' NOT NULL,
	`toc` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`category_name` text DEFAULT '' NOT NULL,
	`visit` integer DEFAULT 0 NOT NULL,
	`like` integer DEFAULT 0 NOT NULL,
	`comment_count` integer DEFAULT 0 NOT NULL,
	`creat_date` text DEFAULT '' NOT NULL,
	`update_date` text DEFAULT '' NOT NULL,
	`is_delete` integer DEFAULT 0 NOT NULL,
	`timestamp` integer
);
--> statement-breakpoint
CREATE INDEX `idx_articles_is_delete_update_date` ON `articles` (`is_delete`,`update_date`);--> statement-breakpoint
CREATE INDEX `idx_articles_is_delete_category_update_date` ON `articles` (`is_delete`,`category`,`update_date`);--> statement-breakpoint
CREATE INDEX `idx_articles_is_delete_category_visit` ON `articles` (`is_delete`,`category`,`visit`);--> statement-breakpoint
CREATE TABLE `categories` (
	`_id` text PRIMARY KEY NOT NULL,
	`cate_name` text NOT NULL,
	`cate_order` text DEFAULT '' NOT NULL,
	`cate_num` integer DEFAULT 0 NOT NULL,
	`creat_date` text DEFAULT '' NOT NULL,
	`is_delete` integer DEFAULT 0 NOT NULL,
	`timestamp` integer
);
--> statement-breakpoint
CREATE INDEX `idx_categories_cate_order` ON `categories` (`cate_order`);--> statement-breakpoint
CREATE TABLE `comments` (
	`_id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`userid` text NOT NULL,
	`content` text NOT NULL,
	`creat_date` text DEFAULT '' NOT NULL,
	`is_delete` integer DEFAULT 0 NOT NULL,
	`timestamp` integer
);
--> statement-breakpoint
CREATE INDEX `idx_comments_article_id_is_delete` ON `comments` (`article_id`,`is_delete`);--> statement-breakpoint
CREATE INDEX `idx_comments_userid` ON `comments` (`userid`);--> statement-breakpoint
CREATE TABLE `genealogy` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`parent` integer NOT NULL,
	`sex` text,
	`desc` text,
	`parent_name` text
);
--> statement-breakpoint
CREATE INDEX `idx_genealogy_parent` ON `genealogy` (`parent`);--> statement-breakpoint
CREATE TABLE `users` (
	`_id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`creat_date` text DEFAULT '' NOT NULL,
	`update_date` text DEFAULT '' NOT NULL,
	`is_delete` integer DEFAULT 0 NOT NULL,
	`timestamp` integer,
	`wx_avatar` text,
	`wx_signature` text
);
--> statement-breakpoint
CREATE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);