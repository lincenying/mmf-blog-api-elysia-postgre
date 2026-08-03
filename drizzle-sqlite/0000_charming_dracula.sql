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
CREATE TABLE `genealogy` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`parent` integer NOT NULL,
	`sex` text,
	`desc` text,
	`parent_name` text
);
--> statement-breakpoint
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
