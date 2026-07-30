/** 测试用固定 ID / 账号（24 位 ObjectId 风格）。 */
export const FIXTURES = {
    admin: {
        id: 'aaaaaaaaaaaaaaaaaaaaaaa1',
        username: 'testadmin',
        password: 'admin123',
        email: 'admin@test.com',
    },
    adminOther: {
        id: 'aaaaaaaaaaaaaaaaaaaaaaa2',
        username: 'testadmin2',
        password: 'admin456',
        email: 'admin2@test.com',
    },
    user: {
        id: 'bbbbbbbbbbbbbbbbbbbbbbb1',
        username: 'testuser',
        password: 'user1234',
        email: 'user@test.com',
    },
    userOther: {
        id: 'bbbbbbbbbbbbbbbbbbbbbbb2',
        username: 'testuser2',
        password: 'user5678',
        email: 'user2@test.com',
    },
    category: {
        id: 'ccccccccccccccccccccccc1',
        name: '测试分类',
        order: '1',
    },
    categoryOther: {
        id: 'ccccccccccccccccccccccc2',
        name: '另一分类',
        order: '2',
    },
    article: {
        id: 'ddddddddddddddddddddddd1',
        title: '测试文章',
        content: '# Hello',
        html: '<h1>Hello</h1>',
    },
    articleOther: {
        id: 'ddddddddddddddddddddddd2',
        title: '另一文章',
        content: '# Other',
        html: '<h1>Other</h1>',
    },
    comment: {
        id: 'eeeeeeeeeeeeeeeeeeeeeee1',
        content: '测试评论',
    },
    genealogy: {
        rootName: '始祖',
        childName: '子辈',
        leafName: '可删成员',
    },
} as const
