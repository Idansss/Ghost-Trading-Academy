import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type SignalOutcomeEmailProps = {
  name: string;
  signal: {
    coin: string;
    direction: string;
    entryZone: string;
    stopLoss: string;
    tp1: string;
    tp2: string;
    tp3: string;
  };
  statusLabel: string;
  note?: string | null;
  signalUrl: string;
};

export default function SignalOutcomeEmail({
  name,
  signal,
  statusLabel,
  note,
  signalUrl,
}: SignalOutcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${signal.coin} update: ${statusLabel}`}</Preview>
      <Body
        style={{
          backgroundColor: "#f8f5ef",
          fontFamily: "Inter, Arial, sans-serif",
          margin: "0 auto",
          padding: "32px 16px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #eadfc7",
            borderRadius: "24px",
            margin: "0 auto",
            maxWidth: "560px",
            overflow: "hidden",
          }}
        >
          <Section
            style={{
              background:
                "linear-gradient(135deg, rgba(197,146,10,0.16) 0%, rgba(255,255,255,1) 62%)",
              padding: "32px",
            }}
          >
            <Text style={{ color: "#9a6c04", fontSize: "12px", fontWeight: "700", margin: "0 0 12px" }}>
              SIGNAL UPDATE
            </Text>
            <Heading style={{ color: "#171717", fontSize: "30px", margin: "0 0 12px" }}>
              {signal.coin} {statusLabel}
            </Heading>
            <Text style={{ color: "#4a4a4a", fontSize: "16px", lineHeight: "24px", margin: "0" }}>
              {name}, the desk posted an outcome update for the {signal.coin} {signal.direction}
              setup.
            </Text>
          </Section>
          <Section style={{ padding: "32px" }}>
            <Text style={{ margin: "0 0 10px" }}>
              <strong>Entry Zone:</strong> {signal.entryZone}
            </Text>
            <Text style={{ margin: "0 0 10px" }}>
              <strong>Stop Loss:</strong> {signal.stopLoss}
            </Text>
            <Text style={{ margin: "0 0 10px" }}>
              <strong>TP1 / TP2 / TP3:</strong> {signal.tp1} / {signal.tp2} / {signal.tp3}
            </Text>
            {note ? (
              <Text
                style={{
                  backgroundColor: "#faf4e7",
                  borderRadius: "16px",
                  color: "#3f3728",
                  margin: "18px 0 0",
                  padding: "14px 16px",
                }}
              >
                {note}
              </Text>
            ) : null}
            <Button
              href={signalUrl}
              style={{
                backgroundColor: "#c5920a",
                borderRadius: "999px",
                color: "#ffffff",
                display: "inline-block",
                fontWeight: "700",
                marginTop: "20px",
                padding: "14px 22px",
                textDecoration: "none",
              }}
            >
              Review Signal
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
