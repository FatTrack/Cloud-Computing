const admin = require("firebase-admin");

const db = admin.firestore();
const articleCollection = db.collection("article");

const HandlerArticle = {
  getAllArticles: async (request, h) => {
    try {
      const snapshot = await articleCollection.get();
      if (snapshot.empty) {
        return h.response({
          code: 200,
          status: "Success",
          data: [],
          message: "No articles found",
        });
      }

      const articles = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        articles.push({
          id: doc.id,
          title: data.title || "No Title",
          author: data.author || "Unknown",
          date: data.date || "No Date",
          description: data.description || "No Description",
          image: data.image || "No Image",
        });
      });

      return h.response({
        code: 200,
        status: "Success",
        data: articles,
      });
    } catch (error) {
      console.error("Error fetching articles:", error);
      return h
        .response({
          code: 500,
          status: "Error",
          message: "Failed to fetch articles",
        })
        .code(500);
    }
  },

  getArticleById: async (request, h) => {
    try {
      const { id } = request.params;
      const doc = await articleCollection.doc(id).get();

      if (!doc.exists) {
        return h
          .response({
            code: 404,
            status: "Error",
            message: "Article not found",
          })
          .code(404);
      }

      const data = doc.data();
      const article = {
        id: doc.id,
        title: data.title || "No Title",
        author: data.author || "Unknown",
        date: data.date || "No Date",
        description: data.description || "No Description",
        image: data.image || "No Image",
      };

      return h.response({
        code: 200,
        status: "Success",
        data: article,
      });
    } catch (error) {
      console.error("Error fetching article:", error);
      return h
        .response({
          code: 500,
          status: "Error",
          message: "Failed to fetch article",
        })
        .code(500);
    }
  },
};

module.exports = HandlerArticle;
