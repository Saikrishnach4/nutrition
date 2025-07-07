import Head from 'next/head';
import UploadForm from '../components/uploadform';

export default function Home() {
  return (
    <>
      <Head>
        <title>Food Nutrition AI</title>
      </Head>
      <main className="min-h-screen bg-white text-gray-900">
        <h1 className="text-3xl text-center mt-10 font-bold">Upload Your Dish</h1>
        <UploadForm />
      </main>
    </>
  );
}
