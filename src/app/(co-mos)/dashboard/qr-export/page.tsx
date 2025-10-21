"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Download, Printer, QrCode } from "lucide-react";
import QRCodeStyling from "qr-code-styling";

type Table = {
  id: string;
  number: number;
  capacity: number;
  available: boolean;
};

export default function QRExportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
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
    const qrUrl = `${baseUrl}/scan/comos-mesa-${table.number}_${table.id.substring(0, 8)}`;

    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      data: qrUrl,
      margin: 10,
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
    for (const table of tables) {
      await downloadQR(table);
      await new Promise((resolve) => setTimeout(resolve, 100));
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
          }
          .no-print {
            display: none !important;
          }
          .qr-card {
            page-break-inside: avoid;
            break-inside: avoid;
          }
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
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium transition hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Descargar Todos
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
        <div className="print-area grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="qr-card rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold">Mesa #{table.number}</h3>
                <p className="text-sm text-white/60">{table.capacity} personas</p>
              </div>

              <div
                ref={(el) => {
                  if (el) qrRefs.current.set(table.id, el);
                }}
                className="mx-auto mb-4 flex items-center justify-center rounded-lg bg-white p-4"
                style={{ width: "fit-content" }}
              />

              <div className="space-y-2">
                <p className="text-xs text-white/40">Escanea para ver el menú</p>
                <p className="text-xs text-white/60 font-mono break-all">
                  {`${window.location.origin}/scan/comos-mesa-${table.number}_${table.id.substring(0, 8)}`}
                </p>
              </div>

              <button
                onClick={() => downloadQR(table)}
                className="no-print mt-4 w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium transition hover:bg-orange-600"
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
