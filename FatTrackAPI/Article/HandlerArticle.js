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

  getArticleByName: async (request, h) => {
    try {
      const { title } = request.query;
  
      if (!title) {
        return h.response({
          code: 400,
          status: "Bad Request",
          message: 'Parameter "title" diperlukan',
        }).code(400);
      }
  
      // Normalisasi input untuk pencarian
      const normalizedTitle = title.toLowerCase();
  
      // Ambil semua artikel dari koleksi
      const articleRef = articleCollection;
      const snapshot = await articleRef.get();
  
      if (snapshot.empty) {
        return h.response({
          code: 404,
          status: "Not Found",
          message: "Tidak ada artikel yang tersedia",
          data: {
            articles: [],
          },
        }).code(404);
      }
  
      // Filter dokumen berdasarkan substring
      const articles = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(article => 
          article.title && 
          typeof article.title === 'string' &&
          article.title.toLowerCase().includes(normalizedTitle)
        );
  
      if (articles.length === 0) {
        return h.response({
          code: 404,
          status: "Not Found",
          message: `Tidak ditemukan artikel yang mengandung kata "${title}"`,
          data: {
            articles: [],
          },
        }).code(404);
      }
  
      return h.response({
        code: 200,
        status: "Success",
        data: {
          message: "Artikel ditemukan",
          articles,
        },
      }).code(200);
    } catch (error) {
      console.error("Error fetching article:", error);
      return h.response({
        code: 500,
        status: "Error",
        message: "Failed to fetch article",
      }).code(500);
    }
  },
};



module.exports = HandlerArticle;
