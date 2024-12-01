# ml-api

## Machine Learning Setup

Please prepare your model in either the `.h5` or saved model format. Place your model in the same folder as the `main.py` file. You will load your model in the code provided below.

## Cloud Computing

You can check the endpoints used for the machine learning models in this API. The available endpoints are `/predict_image` for image-based input.

For the `/predict_image` endpoint, you need to send a multipart-form with a field named "uploaded_file" containing the image file.

## Usage

To get started, follow these steps:

1. Clone the repository:
```sh
git clone https://github.com/your-username/your-repository.git
```

2. Install the required libraries:
```sh
pip install -r requirements.txt
```

3. Prepare your machine learning model:
- If you have an `.h5` model file, place it in the same folder as `main.py`.
- If you have a saved model format, place it in a folder named `my_model_folder` in the same directory as `main.py`.

4. Complete the `predict_text` or `predict_image` function

4. Run the server:
```sh
python main.py
```
>>>>>>> 5224723 (Initialize)
>>>>>>> 35a3777 (Pesan commit pertama)
