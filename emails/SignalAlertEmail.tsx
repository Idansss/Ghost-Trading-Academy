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

type SignalAlertEmailProps = {
  name: string;
  signal: {
    coin: string;
    direction: string;
    entryZone: string;
    stopLoss: string;
    tp1: string;
    tp2: string;
    tp3: string;
    riskLevel: string;
    timeframe: string;
  };
  signalUrl: string;
};

const bodyStyle = {
  backgroundColor: "#f8f5ef",
  fontFamily: "Inter, Arial, sans-serif",
  margin: "0 auto",
  padding: "32px 16px",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #eadfc7",
  borderRadius: "24px",
  margin: "0 auto",
  maxWidth: "560px",
  overflow: "hidden",
};

const sectionStyle = {
  padding: "32px",
};

const statRowStyle = {
  borderBottom: "1px solid #efe7d7",
  margin: "0",
  padding: "10px 0",
};

export default function SignalAlertEmail({ name, signal, signalUrl }: SignalAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${signal.coin} ${signal.direction} signal is live on the desk.`}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section
            style={{
              ...sectionStyle,
              background:
                "linear-gradient(135deg, rgba(197,146,10,0.16) 0%, rgba(255,255,255,1) 62%)",
            }}
          >
            <Text style={{ color: "#9a6c04", fontSize: "12px", fontWeight: "700", margin: "0 0 12px" }}>
              NEW SIGNAL
            </Text>
            <Heading style={{ color: "#171717", fontSize: "30px", margin: "0 0 12px" }}>
              {signal.coin} {signal.direction}
            </Heading>
            <Text style={{ color: "#4a4a4a", fontSize: "16px", lineHeight: "24px", margin: "0" }}>
              {name}, a fresh setup is live on the desk. Review the levels and decide whether it
              fits your plan.
            </Text>
          </Section>
          <Section style={sectionStyle}>
            <Text style={statRowStyle}>
              <strong>Entry Zone:</strong> {signal.entryZone}
            </Text>
            <Text style={statRowStyle}>
              <strong>Stop Loss:</strong> {signal.stopLoss}
            </Text>
            <Text style={statRowStyle}>
              <strong>TP1:</strong> {signal.tp1}
            </Text>
            <Text style={statRowStyle}>
              <strong>TP2:</strong> {signal.tp2}
            </Text>
            <Text style={statRowStyle}>
              <strong>TP3:</strong> {signal.tp3}
            </Text>
            <Text style={statRowStyle}>
              <strong>Risk Level:</strong> {signal.riskLevel}
            </Text>
            <Text style={{ ...statRowStyle, borderBottom: "none" }}>
              <strong>Timeframe:</strong> {signal.timeframe}
            </Text>
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
              Open Signal
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
