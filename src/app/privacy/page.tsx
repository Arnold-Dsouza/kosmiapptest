import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container py-12">
        <h1 className="text-3xl font-bold mb-6 font-headline">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none bg-card p-6 rounded-lg shadow">
          <p>Your privacy is important to us. It is OurScreen&apos;s policy to respect your privacy regarding any information we may collect from you across our website, [Your Website URL], and other sites we own and operate.</p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-3">Information We Collect</h2>
          <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
          <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-3">Sharing Information</h2>
          <p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-3">External Links</h2>
          <p>Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.</p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-3">Your Choices</h2>
          <p>You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.</p>
          <p>Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.</p>
          
          <p className="mt-8"><em>This policy is effective as of [Date]. This is a placeholder Privacy Policy. Please replace with your own comprehensive policy.</em></p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
