import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container py-12">
        <h1 className="text-3xl font-bold mb-6 font-headline">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none bg-card p-6 rounded-lg shadow">          <p>Welcome to OurScreen!</p>
          <p>These terms and conditions outline the rules and regulations for the use of OurScreen&apos;s Website, located at [Your Website URL].</p>
          <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use OurScreen if you do not agree to take all of the terms and conditions stated on this page.</p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-3">Cookies</h2>
          <p>We employ the use of cookies. By accessing OurScreen, you agreed to use cookies in agreement with the OurScreen&apos;s Privacy Policy.</p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-3">License</h2>
          <p>Unless otherwise stated, OurScreen and/or its licensors own the intellectual property rights for all material on OurScreen. All intellectual property rights are reserved. You may access this from OurScreen for your own personal use subjected to restrictions set in these terms and conditions.</p>
          <p>You must not:</p>
          <ul>
            <li>Republish material from OurScreen</li>
            <li>Sell, rent or sub-license material from OurScreen</li>
            <li>Reproduce, duplicate or copy material from OurScreen</li>
            <li>Redistribute content from OurScreen</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-6 mb-3">User Comments</h2>
          <p>This Agreement shall begin on the date hereof.</p>
          <p>Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. OurScreen does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of OurScreen, its agents and/or affiliates. Comments reflect the views and opinions of the person who post their views and opinions.</p>
          
          <p className="mt-8"><em>This is a placeholder Terms of Service. Please replace with your own comprehensive terms.</em></p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
