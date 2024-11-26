const { Firestore } = require('@google-cloud/firestore');
const path = require('path');

const keyFilePath = path.resolve(__dirname, '../firebase-service-account.json');

// Inisialisasi Firestore
const firestore = new Firestore({
  projectId: 'capstone-project-c242-ps030',
  keyFilename: keyFilePath,
});

const searchFoodHandler = async (request, h) => {
    const { nama } = request.query;

    if (!nama) {
        return h.response({
            code: 400,
            status: 'Bad Request',
            message: 'Nama makanan harus diisi!'
        }).code(400);
    }

    // Cek jika input mengandung huruf besar
    if (/[A-Z]/.test(nama)) {
        return h.response({
            code: 400,
            status: 'Bad Request',
            message: 'Input tidak boleh mengandung huruf besar!'
        }).code(400);
    }

    try {
        // Query Firestore untuk mencari makanan berdasarkan nama
        const makananRef = firestore.collection('makanan');
        const snapshot = await makananRef.where('nama', '==', nama).get();

        if (snapshot.empty) {
            return h.response({
                code: 404,
                status: 'Not Found',
                message: 'Makanan tidak ditemukan.'
            }).code(404);
        }

        const result = [];
        snapshot.forEach((doc) => {
            result.push({
                code: 200,
                status: 'Success',
                data: {
                    id: doc.id, ...doc.data()
                },
            });
        });

        return h.response(result).code(200);
    } catch (error) {
        console.error('Error fetching data:', error);
        return h.response({ error: 'Terjadi kesalahan pada server.' }).code(500);
    }
};

module.exports = {
    searchFoodHandler,
};
