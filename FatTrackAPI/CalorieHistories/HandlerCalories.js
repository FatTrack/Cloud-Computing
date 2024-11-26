const admin = require('firebase-admin');
const moment = require('moment');

const db = admin.firestore();

const getDailyCalories = async (request, h) => {
  const { userId } = request.params;
  const today = moment().startOf('day'); // Awal hari ini
  const endOfDay = moment().endOf('day'); // Akhir hari ini

  try {
    // Periksa apakah userId ada di koleksi 'user'
    const userDoc = await db.collection('user').doc(userId).get();

    if (!userDoc.exists) {
      return h.response({
        code: 404,
        status: 'Not Found',
        data: {
          message: `User ID ${userId} tidak ditemukan.`,
        }
      }).code(404);
    }

    // Referensi ke subkoleksi predictions di user yang ditentukan
    const predictionsRef = db.collection('user')
      .doc(userId)
      .collection('predictions');  // Pastikan path ini sesuai dengan struktur Firestore Anda

    

    // Ambil semua dokumen dalam subkoleksi predictions
    const snapshot = await predictionsRef.get();

    let totalKalori = 0;
    let totalProtein = 0;
    let totalLemak = 0;
    let totalKarbohidrat = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = moment(data.createdAt.toDate()); // Konversi ke Moment.js

      // Cek apakah createdAt dalam rentang hari ini
      if (createdAt.isBetween(today, endOfDay, '[]')) {
        const { nutritional_info } = data;  // Pastikan ini sesuai dengan struktur data Anda

        // Menambahkan nilai nutrisi dari field 'nutritional_info'
        totalKalori += nutritional_info?.kalori || 0;
        totalProtein += nutritional_info?.protein || 0;
        totalLemak += nutritional_info?.lemak || 0;
        totalKarbohidrat += nutritional_info?.karbohidrat || 0;
      }
    });

    return h.response({
      code: 200,
      status: 'Success',
      data: {
        message: 'Tracking data fetched successfully',
        date: today.format('dddd, DD MMMM YYYY'),
        totalKalori,
        totalProtein,
        totalLemak,
        totalKarbohidrat,
      }
    }).code(200);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return h.response({
      code: 500,
      status: 'Error',
      message: 'Failed to fetch tracking data',
      error: error.message,
    }).code(500);
  }
};

module.exports = { getDailyCalories };
