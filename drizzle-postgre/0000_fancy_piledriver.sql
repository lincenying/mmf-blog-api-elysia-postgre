CREATE TABLE "users" (
	"_id" text PRIMARY KEY NOT NULL,
	"creat_date" timestamp,
	"email" text NOT NULL,
	"is_delete" integer DEFAULT 0,
	"password" text NOT NULL,
	"timestamp" integer,
	"update_date" timestamp,
	"username" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
