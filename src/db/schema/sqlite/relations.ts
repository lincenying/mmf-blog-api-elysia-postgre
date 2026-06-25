import { relations } from 'drizzle-orm'
import { articleLikes } from './article-likes'
import { articles } from './articles'
import { comments } from './comments'
import { users } from './users'

export const commentsRelations = relations(comments, ({ one }) => ({
    user: one(users, {
        fields: [comments.userid],
        references: [users._id],
    }),
}))

export const articlesRelations = relations(articles, ({ many }) => ({
    likes: many(articleLikes),
}))

export const articleLikesRelations = relations(articleLikes, ({ one }) => ({
    article: one(articles, {
        fields: [articleLikes.article_id],
        references: [articles._id],
    }),
}))
