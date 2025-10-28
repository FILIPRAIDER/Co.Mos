import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  userName: string;
  userEmail?: string;
  userDocument: string;
  userPassword: string;
  userRole: string;
  restaurantName: string;
  loginUrl: string;
}

export const WelcomeEmail = ({
  userName = "Usuario",
  userEmail,
  userDocument = "1234567890",
  userPassword = "password123",
  userRole = "MESERO",
  restaurantName = "co.mos",
  loginUrl = "https://equipos.online/auth/login",
}: WelcomeEmailProps) => {
  const roleNames: Record<string, string> = {
    ADMIN: "Administrador",
    MESERO: "Mesero",
    COCINERO: "Cocinero",
  };

  return (
    <Html>
      <Head />
      <Preview>Bienvenido a {restaurantName} - Tus credenciales de acceso</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo and Header */}
          <Section style={header}>
            <Img
              src="https://ik.imagekit.io/comos/Logo.svg"
              width="50"
              height="50"
              alt="co.mos"
              style={logo}
            />
            <Heading style={h1}>¡Bienvenido al equipo!</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={paragraph}>
              Hola <strong>{userName}</strong>,
            </Text>
            <Text style={paragraph}>
              Te damos la bienvenida a <strong>{restaurantName}</strong>. Has sido
              registrado en el sistema co.mos como <strong>{roleNames[userRole]}</strong>.
            </Text>

            {/* Credentials Box */}
            <Section style={credentialsBox}>
              <Heading style={h2}>📋 Tus Credenciales de Acceso</Heading>
              <table style={credentialsTable}>
                <tr>
                  <td style={labelCell}>Usuario:</td>
                  <td style={valueCell}>
                    <code style={code}>{userEmail || userDocument}</code>
                  </td>
                </tr>
                <tr>
                  <td style={labelCell}>Contraseña:</td>
                  <td style={valueCell}>
                    <code style={code}>{userPassword}</code>
                  </td>
                </tr>
                <tr>
                  <td style={labelCell}>Rol:</td>
                  <td style={valueCell}>
                    <strong>{roleNames[userRole]}</strong>
                  </td>
                </tr>
              </table>
            </Section>

            <Text style={warningText}>
              ⚠️ <strong>Importante:</strong> Por seguridad, <strong>debes cambiar tu
              contraseña</strong> al iniciar sesión por primera vez. El sistema te solicitará
              crear una nueva contraseña más segura.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Iniciar Sesión Ahora
              </Button>
            </Section>

            <Text style={paragraph}>
              También puedes copiar y pegar este enlace en tu navegador:
            </Text>
            <Link href={loginUrl} style={link}>
              {loginUrl}
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este correo fue enviado desde <strong>co.mos</strong> para {restaurantName}
            </Text>
            <Text style={footerText}>
              Si tienes alguna pregunta, contacta con el administrador del restaurante.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  textAlign: "center" as const,
  backgroundColor: "#000000",
  borderRadius: "12px 12px 0 0",
};

const logo = {
  margin: "0 auto",
  marginBottom: "16px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
  padding: "0",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  padding: "0",
};

const content = {
  padding: "24px 32px",
};

const paragraph = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
  marginBottom: "16px",
};

const credentialsBox = {
  backgroundColor: "#f9fafb",
  border: "2px solid #e5e7eb",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const credentialsTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const labelCell = {
  padding: "8px 0",
  fontSize: "14px",
  color: "#6b7280",
  fontWeight: "600",
  width: "30%",
};

const valueCell = {
  padding: "8px 0",
  fontSize: "16px",
  color: "#111827",
};

const code = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  padding: "4px 8px",
  fontFamily: "monospace",
  fontSize: "14px",
  color: "#f97316",
  fontWeight: "600",
};

const warningText = {
  ...paragraph,
  backgroundColor: "#fef3c7",
  border: "1px solid #fbbf24",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  color: "#78350f",
  marginTop: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#f97316",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
  cursor: "pointer",
};

const link = {
  color: "#f97316",
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const footer = {
  padding: "24px 32px",
  borderTop: "1px solid #e5e7eb",
};

const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center" as const,
  margin: "4px 0",
};
