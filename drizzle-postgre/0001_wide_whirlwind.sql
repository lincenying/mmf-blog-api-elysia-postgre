CREATE TABLE "admins" (
	"_id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"creat_date" text DEFAULT '' NOT NULL,
	"update_date" text DEFAULT '' NOT NULL,
	"is_delete" integer DEFAULT 0 NOT NULL,
	"timestamp" integer
);
--> statement-breakpoint
CREATE TABLE "article_likes" (
	"article_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "article_likes_article_id_user_id_pk" PRIMARY KEY("article_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"html" text DEFAULT '' NOT NULL,
	"toc" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"category_name" text DEFAULT '' NOT NULL,
	"visit" integer DEFAULT 0 NOT NULL,
	"like" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"creat_date" text DEFAULT '' NOT NULL,
	"update_date" text DEFAULT '' NOT NULL,
	"is_delete" integer DEFAULT 0 NOT NULL,
	"timestamp" integer
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"_id" text PRIMARY KEY NOT NULL,
	"cate_name" text NOT NULL,
	"cate_order" text DEFAULT '' NOT NULL,
	"cate_num" integer DEFAULT 0 NOT NULL,
	"creat_date" text DEFAULT '' NOT NULL,
	"update_date" text DEFAULT '' NOT NULL,
	"is_delete" integer DEFAULT 0 NOT NULL,
	"timestamp" integer
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"_id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"userid" text NOT NULL,
	"content" text NOT NULL,
	"creat_date" text DEFAULT '' NOT NULL,
	"is_delete" integer DEFAULT 0 NOT NULL,
	"timestamp" integer
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "creat_date" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "creat_date" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "creat_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_delete" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "update_date" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "update_date" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "update_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wx_avatar" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wx_signature" text;