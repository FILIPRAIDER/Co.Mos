import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = session.user?.restaurantId;
    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurante no encontrado" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "today";

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "month") {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Fetch orders in date range - SOLO del restaurante del usuario
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: restaurantId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate stats
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.status === "PAGADA" || o.status === "COMPLETADA")
      .reduce((sum, o) => sum + o.total, 0);
    const totalTips = orders
      .filter((o) => o.status === "PAGADA" || o.status === "COMPLETADA")
      .reduce((sum, o) => sum + (o.tip || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products
    const productSales = new Map<
      string,
      { productName: string; quantity: number; revenue: number }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productSales.get(item.productId) || {
          productName: item.product.name,
          quantity: 0,
          revenue: 0,
        };
        productSales.set(item.productId, {
          productName: item.product.name,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.price * item.quantity,
        });
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        ...data,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Revenue by day
    const revenueByDay = orders
      .filter((o) => o.status === "PAGADA" || o.status === "COMPLETADA")
      .reduce((acc, order) => {
        const date = order.createdAt.toISOString().split("T")[0];
        const existing = acc.find((item) => item.date === date);
        if (existing) {
          existing.revenue += order.total;
          existing.orders += 1;
        } else {
          acc.push({ date, revenue: order.total, orders: 1 });
        }
        return acc;
      }, [] as Array<{ date: string; revenue: number; orders: number }>)
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      totalTips,
      averageOrderValue,
      topProducts,
      ordersByStatus,
      revenueByDay,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Error al obtener reportes" },
      { status: 500 }
    );
  }
}
