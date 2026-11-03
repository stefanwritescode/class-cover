import Link from "next/link";

// DRAFT. Written from what the app actually collects and where it sends data.
// Needs review by someone qualified in POPIA before real teachers sign up, including
// each provider's data processing terms.

export const metadata = { title: "Privacy notice · Class Cover" };

const UPDATED = "3 November 2026";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-4 font-display text-xl font-semibold">{children}</h2>;
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto grid max-w-2xl gap-3 px-5 pb-16 pt-8 text-[15px] leading-relaxed">
      <p className="rounded-2xl bg-urgent-soft px-4 py-3 text-sm">
        <b>Draft for review.</b> This notice hasn&apos;t been checked by a legal adviser yet.
      </p>

      <p className="text-xs font-semibold uppercase tracking-widest text-muted">Class Cover</p>
      <h1 className="text-3xl font-bold">Privacy notice</h1>
      <p className="text-sm text-muted">Last updated {UPDATED}</p>

      <p>
        Class Cover helps Pilates studios find cover teachers at short notice. This notice explains what personal information we
        collect about teachers and studio staff, why, who we share it with, and your rights under the Protection of Personal
        Information Act (POPIA).
      </p>

      <H>Who is responsible</H>
      <p>
        The responsible party is Lungile Health (Pty) Ltd, registration number 2014/069056/07, 12 Beachway, Durban North, 4051.
        Our Information Officer is Stefan van der Merwe, who you can contact at{" "}
        <a href="mailto:stefan@lungilehealth.com" className="font-semibold text-accent">stefan@lungilehealth.com</a>.
      </p>

      <H>What we collect</H>
      <ul className="list-disc space-y-1 pl-5">
        <li><b>Account details:</b> your name and email address, and a password if you set one.</li>
        <li><b>Contact details:</b> your mobile number, and whether you want cover alerts on WhatsApp.</li>
        <li><b>Teaching profile:</b> the area you live in, years teaching, the teacher trainings you&apos;ve completed, and what work you&apos;re open to.</li>
        <li><b>Documents:</b> the expiry dates of your first aid certificate and insurance, and any certificates you choose to upload.</li>
        <li><b>Availability:</b> the studios, days and times you want cover alerts for.</li>
        <li><b>Payment details:</b> your bank name, account number and branch code, so studios can pay you for covers.</li>
        <li><b>Cover history:</b> covers you accepted or handed back, check-in times, and what you were paid.</li>
        <li><b>Studio notes:</b> a studio may record its vetting stage for you, a private rating of 1 to 5 after a cover, and short notes. Only that studio sees these.</li>
      </ul>
      <p>We don&apos;t ask for your ID number, and we don&apos;t collect health information about you or about studio clients.</p>

      <H>Why we use it</H>
      <ul className="list-disc space-y-1 pl-5">
        <li>To check your training and approve you to teach covers.</li>
        <li>To alert you when a class you can teach needs cover, and to let you accept it.</li>
        <li>To give the teacher covering a class the details they need, such as access instructions.</li>
        <li>To record covers so studios can pay you correctly.</li>
        <li>If you choose, to let other verified studios on Class Cover find you.</li>
      </ul>
      <p>
        We rely on your consent, which you give when you create your profile, and on what&apos;s needed to arrange and pay for the
        covers you take on. You can withdraw consent at any time; we&apos;ll then stop offering you covers.
      </p>

      <H>Who can see it</H>
      <ul className="list-disc space-y-1 pl-5">
        <li><b>Studios you work with</b> see your profile, training, contact details and cover history with them.</li>
        <li><b>Studios that approve you</b> also see your bank details, so they can pay you.</li>
        <li>
          <b>Other verified studios</b> see only your name, area, training and the work you&apos;re open to, and only if you choose
          that in your profile. They never see your phone, email or bank details unless you accept their request.
        </li>
        <li><b>Class Cover&apos;s administrators</b> can see your information to run and support the service.</li>
      </ul>
      <p>We don&apos;t sell your information or use it for advertising.</p>

      <H>Services we use</H>
      <p>We use these providers to run Class Cover. Some store or process information outside South Africa:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li><b>Supabase:</b> stores the app&apos;s data and handles sign-in. Data is held in London, United Kingdom.</li>
        <li><b>Vercel:</b> hosts the app. Requests may be processed in data centres outside South Africa.</li>
        <li><b>ManyChat and Meta (WhatsApp):</b> send cover alerts. ManyChat holds your name, WhatsApp number and the details of each alert.</li>
        <li><b>Resend:</b> sends sign-in and account emails.</li>
      </ul>
      <p>
        Where information is processed outside South Africa, we rely on these providers&apos; contractual data-protection commitments,
        as POPIA requires for cross-border transfers.
      </p>

      <H>How long we keep it</H>
      <p>
        We keep your profile while your account is open. When you delete your account we remove your profile, contact and payment
        details. Records of covers and payments are kept for 5 years for tax and accounting purposes.
      </p>

      <H>Keeping it safe</H>
      <p>
        Access to information is limited by role in the database itself, so studios only ever see what&apos;s described above. Bank
        details and certificates are stored privately and only shown to people allowed to see them. Connections are encrypted.
      </p>

      <H>Your rights</H>
      <p>You can ask us to:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>tell you what personal information we hold about you, and give you a copy;</li>
        <li>correct or update it (you can change most of it yourself in your profile);</li>
        <li>delete it, or stop using it;</li>
        <li>stop sending you WhatsApp alerts (turn them off in your profile).</li>
      </ul>
      <p>
        To make a request, email{" "}
        <a href="mailto:stefan@lungilehealth.com" className="font-semibold text-accent">stefan@lungilehealth.com</a>. If you&apos;re unhappy with how we handle your information, you can complain to the
        Information Regulator: <span className="font-mono text-sm">complaints.IR@inforegulator.org.za</span>,{" "}
        <a href="https://inforegulator.org.za" className="font-semibold text-accent" target="_blank" rel="noreferrer">inforegulator.org.za</a>.
      </p>

      <H>Changes</H>
      <p>If we change this notice in a way that matters, we&apos;ll tell you in the app or by email before it takes effect.</p>

      <Link href="/" className="mt-6 text-sm font-semibold text-accent">← Back to Class Cover</Link>
    </main>
  );
}
