"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Download, Printer, QrCode } from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import JSZip from "jszip";

type Table = {
  id: string;
  number: number;
  capacity: number;
  available: boolean;
  qrCode: string;
};

export default function QRExportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const qrRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables");
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (table: Table, element: HTMLDivElement) => {
    const baseUrl = window.location.origin;
    const qrUrl = `${baseUrl}/scan/${table.qrCode}`;

    const qrCode = new QRCodeStyling({
      width: 240,
      height: 240,
      data: qrUrl,
      margin: 8,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: "H",
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 4,
      },
      dotsOptions: {
        color: "#ea580c",
        type: "rounded",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      cornersSquareOptions: {
        color: "#ea580c",
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: "#ea580c",
        type: "dot",
      },
    });

    element.innerHTML = "";
    qrCode.append(element);
  };

  useEffect(() => {
    if (tables.length > 0) {
      tables.forEach((table) => {
        const element = qrRefs.current.get(table.id);
        if (element) {
          generateQRCode(table, element);
        }
      });
    }
  }, [tables]);

  const downloadQR = async (table: Table) => {
    const element = qrRefs.current.get(table.id);
    if (!element) return;

    const canvas = element.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR-Mesa-${table.number}.png`;
      a.click();
    }
  };

  const downloadAllQRs = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const qrFolder = zip.folder("QR-Codes-Mesas");

      if (!qrFolder) return;

      // Agregar cada QR al ZIP
      for (const table of tables) {
        const element = qrRefs.current.get(table.id);
        if (!element) continue;

        const canvas = element.querySelector("canvas");
        if (canvas) {
          // Convertir canvas a blob
          const dataUrl = canvas.toDataURL("image/png");
          const base64Data = dataUrl.split(",")[1];
          
          // Agregar al ZIP
          qrFolder.file(`Mesa-${table.number}.png`, base64Data, { base64: true });
        }
      }

      // Generar y descargar el ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR-Codes-Mesas-${new Date().toISOString().split("T")[0]}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating ZIP:", error);
      alert("Error al generar el archivo ZIP");
    } finally {
      setDownloadingZip(false);
    }
  };

  const printQRs = () => {
    window.print();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1rem !important;
            padding: 1rem !important;
          }
          .no-print {
            display: none !important;
          }
          .qr-card {
            page-break-inside: avoid;
            break-inside: avoid;
            border: 2px solid #333 !important;
            padding: 1rem !important;
            background: white !important;
            color: black !important;
          }
          .qr-card h3,
          .qr-card p {
            color: black !important;
          }
        }
        
        .qr-container canvas {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
      `}</style>

      <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
        {/* Header - No Print */}
        <div className="mb-6 no-print">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 rounded-lg bg-zinc-900 border border-zinc-800 p-2 transition hover:border-zinc-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <QrCode className="h-6 w-6 text-orange-500" />
                Códigos QR de Mesas
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Descarga o imprime los códigos QR para tus mesas
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={downloadAllQRs}
                disabled={downloadingZip}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingZip ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Generando ZIP...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Descargar ZIP
                  </>
                )}
              </button>
              <button
                onClick={printQRs}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* QR Grid */}
        <div className="print-area grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="qr-card rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center flex flex-col"
            >
              <div className="mb-3">
                <h3 className="text-lg font-bold">Mesa #{table.number}</h3>
                <p className="text-xs text-white/60">{table.capacity} personas</p>
              </div>

              <div
                ref={(el) => {
                  if (el) qrRefs.current.set(table.id, el);
                }}
                className="qr-container mx-auto mb-3 flex items-center justify-center rounded-lg bg-white p-3 max-w-full overflow-hidden"
                style={{ width: "100%", maxWidth: "260px" }}
              >
                {/* QR Code will be rendered here */}
              </div>

              <div className="space-y-1 mb-3">
                <p className="text-xs text-white/40">Escanea para ver el menú</p>
                <p className="text-[10px] text-white/50 font-mono break-all px-2">
                  {`${window.location.origin}/scan/${table.qrCode}`}
                </p>
              </div>

              <button
                onClick={() => downloadQR(table)}
                className="no-print mt-auto w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium transition hover:bg-orange-600"
              >
                <Download className="inline-block h-4 w-4 mr-2" />
                Descargar
              </button>
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-12">
            <QrCode className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No hay mesas configuradas</p>
            <button
              onClick={() => router.push("/dashboard/mesas")}
              className="mt-4 rounded-lg bg-orange-500 px-6 py-2 font-medium transition hover:bg-orange-600"
            >
              Ir a Mesas
            </button>
          </div>
        )}
      </div>
    </>
  );
}
