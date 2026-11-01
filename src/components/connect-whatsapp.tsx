import Link from "next/link";
import { buttonClass, Card } from "@/components/ui";
import { whatsappConnectUrl } from "@/lib/manychat";

/** Prompts a teacher to link their WhatsApp so cover alerts can reach them. */
export function ConnectWhatsApp({ code }: { code: string }) {
  return (
    <Card tone="urgent">
      <div className="grid gap-1">
        <p className="font-display text-lg font-semibold">Connect your WhatsApp</p>
        <p className="text-sm text-muted">
          Cover alerts come by WhatsApp. Tap below, then press send on the message that opens. Don&apos;t change the text; it has your
          personal code.
        </p>
      </div>
      <a href={whatsappConnectUrl(code)} target="_blank" rel="noreferrer" className={`${buttonClass()} w-full`}>
        Connect WhatsApp
      </a>
      <Link href="/teach" className="justify-self-center text-sm font-semibold text-accent">I&apos;ve sent it, check again</Link>
    </Card>
  );
}
