// SilentFall Blog MongoDB 初始化脚本
db = db.getSiblingDB('silentfall');

// 创建集合和索引
db.createCollection('admin');
db.createCollection('articles');
db.createCollection('article_categories');
db.createCollection('article_comments');
db.createCollection('article_likes');
db.createCollection('article_tags');
db.createCollection('article_tag_relations');
db.createCollection('friend_links');
db.createCollection('messages');
db.createCollection('music');
db.createCollection('operation_logs');
db.createCollection('personal_info');
db.createCollection('rss_subscription');
db.createCollection('system_config');
db.createCollection('view');
db.createCollection('visitor');

// 创建索引
db.articles.createIndex({ "slug": 1 }, { unique: true });
db.articles.createIndex({ "categoryId": 1 });
db.articles.createIndex({ "isPublished": 1 });
db.article_categories.createIndex({ "slug": 1 }, { unique: true });
db.article_comments.createIndex({ "articleId": 1 });
db.article_comments.createIndex({ "visitorId": 1 });
db.article_likes.createIndex({ "articleId": 1, "visitorId": 1 }, { unique: true });
db.article_tags.createIndex({ "slug": 1 }, { unique: true });
db.article_tag_relations.createIndex({ "articleId": 1, "tagId": 1 }, { unique: true });
db.messages.createIndex({ "visitorId": 1 });
db.operation_logs.createIndex({ "adminId": 1 });
db.rss_subscription.createIndex({ "visitorId": 1 });
db.view.createIndex({ "pagePath": 1 }, { unique: true });
db.visitor.createIndex({ "ip": 1 }, { unique: true });
