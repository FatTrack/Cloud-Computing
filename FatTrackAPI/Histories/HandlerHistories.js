const moment = require("moment-timezone");
const admin = require("firebase-admin");

const db = admin.firestore();

const getAllHistoryin3Days = async (request, h) => {
  try {
      const { userId } = request.params; // Mengambil id user dari parameter URL
      const threeDaysAgo = moment().subtract(2, "days").startOf("day");
      const today = moment().endOf("day");

      const userDoc = await db.collection("user").doc(userId).get();
      if (!userDoc.exists) {
          return h.response({
              code: 404,
              status: "Not Found",
              data: {
                  message: "User not found",
              },
          }).code(404);
      }

      // Ambil subcollection predictions
      const predictionsSnapshot = await db
          .collection("user")
          .doc(userId)
          .collection("predictions")
          .where("createdAt", ">=", threeDaysAgo.toDate())
          .where("createdAt", "<=", today.toDate())
          .get();

      if (predictionsSnapshot.empty) {
          return h.response({
              code: 404,
              status: "Not Found",
              data: {
                  message: "No predictions found",
              },
          }).code(404);
      }

      // Proses data
      const predictions = predictionsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
              food_name: data.nutritional_info?.nama || "Unknown",
              prediction_date: moment(data.createdAt.toDate())
                    .tz("Asia/Jakarta")
                    .format("YYYY-MM-DD HH:mm:ss"),
              calories: data.nutritional_info?.kalori || 0,
              image_url: data.image_url,
          };
      });

      // Mengembalikan semua data prediksi
      const response = {
          code: 200,
          status: "Success",
          data: predictions, // Tidak dikelompokkan
      };

      return h.response(response).code(200);
  } catch (error) {
      console.error("Error fetching predictions:", error);
      return h
          .response({ message: "Internal Server Error", error: error.message })
          .code(500);
  }
};



const getHistoryin7Days = async (request, h) => {
    try {
      const { userId } = request.params; // Mengambil id user dari parameter URL
      const sixDaysAgo = moment().subtract(6, "days").startOf("day");
      const today = moment().endOf("day");
  
      // Periksa apakah user dengan ID yang diberikan ada
      const userDoc = await db.collection("user").doc(userId).get();
      if (!userDoc.exists) {
        return h.response({
          code: 404,
          status: "Not Found",
          data: {
            message: "User not found",
          },
        }).code(404);
      }
  
      // Ambil subcollection predictions
      const predictionsSnapshot = await db
        .collection("user")
        .doc(userId)
        .collection("predictions")
        .where("createdAt", ">=", sixDaysAgo.toDate())
        .where("createdAt", "<=", today.toDate())
        .get();
  
      // Proses data prediksi
      const predictions = predictionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          calories: data.nutritional_info?.kalori || 0,
          prediction_date: moment(data.createdAt.toDate()).format("YYYY-MM-DD"),
        };
      });
  
      // Hitung total kalori per hari
      const totalCaloriesPerDay = predictions.reduce((acc, prediction) => {
        const date = prediction.prediction_date;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += prediction.calories;
        return acc;
      }, {});
  
      // Buat daftar semua tanggal dalam rentang waktu 6 hari terakhir
      const dateRange = [];
      for (let i = 6; i >= 0; i--) {
        dateRange.push(moment().subtract(i, "days").format("YYYY-MM-DD"));
      }
  
      // Gabungkan data prediksi dengan tanggal yang tidak memiliki hasil
      const result = dateRange.map((date) => ({
        date,
        total_calories: totalCaloriesPerDay[date] || 0, // Jika tidak ada data, setel ke 0
      }));
  
      const response = {
        code: 200,
        status: "Success",
        data: result,
      };
  
      return h.response(response).code(200);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      return h
        .response({ message: "Internal Server Error", error: error.message })
        .code(500);
    }
  };
  

  const getHistoryin30Days = async (request, h) => {
    try {
      const { userId } = request.params; // Mengambil id user dari parameter URL
      const startDate = moment().subtract(29, "days").startOf("day");
      const endDate = moment().endOf("day");
  
      // Periksa apakah user dengan ID yang diberikan ada
      const userDoc = await db.collection("user").doc(userId).get();
      if (!userDoc.exists) {
        return h.response({
          code: 404,
          status: "Not Found",
          data: {
            message: "User not found",
          },
        }).code(404);
      }
  
      // Ambil subcollection predictions
      const predictionsSnapshot = await db
        .collection("user")
        .doc(userId)
        .collection("predictions")
        .where("createdAt", ">=", startDate.toDate())
        .where("createdAt", "<=", endDate.toDate())
        .get();
  
      // Proses data prediksi
      const predictions = predictionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          calories: data.nutritional_info?.kalori || 0,
          prediction_date: moment(data.createdAt.toDate()).format("YYYY-MM-DD"),
        };
      });
  
      // Hitung total kalori per hari
      const totalCaloriesPerDay = predictions.reduce((acc, prediction) => {
        const date = prediction.prediction_date;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += prediction.calories;
        return acc;
      }, {});
  
      // Buat daftar semua tanggal dalam rentang waktu 30 hari terakhir
      const dateRange = [];
      for (let i = 29; i >= 0; i--) {
        dateRange.push(moment().subtract(i, "days").format("YYYY-MM-DD"));
      }
  
      // Gabungkan data prediksi dengan tanggal yang tidak memiliki hasil
      const dailyResult = dateRange.map((date) => ({
        date,
        total_calories: totalCaloriesPerDay[date] || 0, // Jika tidak ada data, setel ke 0
      }));
  
      // Kalkulasi data per minggu
      const weeklyResult = [];
      let weekNumber = 1;
      for (let i = 0; i < dateRange.length; i += 7) {
        const weekData = dailyResult.slice(i, i + 7);
        const totalCalories = weekData.reduce((sum, day) => sum + day.total_calories, 0);
  
        weeklyResult.push({
          week: weekNumber++,
          "start-end": `${weekData[0].date} - ${weekData[weekData.length - 1].date}`,
          total_calories: totalCalories,
        });
      }
  
      const response = {
        code: 200,
        status: "Success",
        data: weeklyResult,
      };
  
      return h.response(response).code(200);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      return h
        .response({ message: "Internal Server Error", error: error.message })
        .code(500);
    }
  };
  
  
  
module.exports = { getAllHistoryin3Days, getHistoryin7Days, getHistoryin30Days };
