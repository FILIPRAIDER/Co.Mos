"use client";

import { useMemo, useState, useEffect, type ComponentType, type SVGProps } from "react";
import { useSession } from "next-auth/react";
import { MoreVertical, Plus, Edit, XCircle, RefreshCw } from "lucide-react";

type TableStatus = "disponible" | "preparacion" | "entrega" | "atencion";
type OrderStatus = "PENDING" | "PREPARING" | "READY" | "DELIVERED" | "PAID" | "CANCELLED";

type TableData = {
	id: string;
	number: number;
	capacity: number;
	available: boolean;
	orders?: Array<{
		id: string;
		status: OrderStatus;
		items: Array<{
			quantity: number;
			product: {
				name: string;
			};
		}>;
	}>;
};

const statusStyles: Record<TableStatus, { bar: string; label: string; text: string }> = {
	disponible: {
		bar: "bg-emerald-400",
		label: "text-emerald-300",
		text: "Disponible",
	},
	preparacion: {
		bar: "bg-amber-400",
		label: "text-amber-300",
		text: "En preparación",
	},
	entrega: {
		bar: "bg-sky-400",
		label: "text-sky-300",
		text: "Por entregar",
	},
	atencion: {
		bar: "bg-rose-400",
		label: "text-rose-300",
		text: "Requiere atención",
	},
};

type IconProps = SVGProps<SVGSVGElement>;

export default function DashboardPage() {
	const { data: session } = useSession();
	const [openDropdown, setOpenDropdown] = useState<number | null>(null);
	const [tables, setTables] = useState<TableData[]>([]);
	const [orders, setOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchData();
		// Refrescar cada 30 segundos
		const interval = setInterval(fetchData, 30000);
		return () => clearInterval(interval);
	}, []);

	const fetchData = async () => {
		try {
			const [tablesRes, ordersRes] = await Promise.all([
				fetch('/api/tables'),
				fetch('/api/orders')
			]);
			
			if (tablesRes.ok && ordersRes.ok) {
				const tablesData = await tablesRes.json();
				const ordersData = await ordersRes.json();
				setTables(tablesData);
				setOrders(ordersData);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			setLoading(false);
		}
	};

	const getTableStatus = (table: TableData): TableStatus => {
		const activeOrders = orders.filter(
			order => order.tableId === table.id && 
			order.status !== 'PAID' && 
			order.status !== 'CANCELLED'
		);

		if (activeOrders.length === 0) return "disponible";
		
		const hasReady = activeOrders.some(o => o.status === 'READY');
		if (hasReady) return "entrega";
		
		const hasPreparing = activeOrders.some(o => o.status === 'PREPARING');
		if (hasPreparing) return "preparacion";
		
		const hasDelivered = activeOrders.some(o => o.status === 'DELIVERED');
		if (hasDelivered) return "atencion";
		
		return "preparacion";
	};

	const getTableOrders = (table: TableData) => {
		return orders.filter(
			order => order.tableId === table.id && 
			order.status !== 'PAID' && 
			order.status !== 'CANCELLED'
		);
	};

	const stats = useMemo(() => {
		const occupiedTables = tables.filter(t => {
			const tableOrders = orders.filter(
				o => o.tableId === t.id && o.status !== 'PAID' && o.status !== 'CANCELLED'
			);
			return tableOrders.length > 0;
		}).length;

		const activeOrders = orders.filter(
			o => o.status !== 'PAID' && o.status !== 'CANCELLED'
		).length;

		const totalRevenue = orders
			.filter(o => o.status === 'PAID')
			.reduce((sum, o) => sum + o.total, 0);

		const totalTips = orders
			.filter(o => o.status === 'PAID')
			.reduce((sum, o) => sum + (o.tip || 0), 0);

		return [
			{
				label: "Mesas Ocupadas",
				value: occupiedTables.toString(),
				helper: "Salón principal",
				accent: "bg-emerald-400/20 text-emerald-300",
				icon: TablesIcon,
			},
			{
				label: "Pedidos en Curso",
				value: activeOrders.toString(),
				helper: "Hoy",
				accent: "bg-amber-400/20 text-amber-300",
				icon: OrdersIcon,
			},
			{
				label: "Propinas Recibidas",
				value: `$${totalTips.toLocaleString()}`,
				helper: "Semana actual",
				accent: "bg-emerald-400/20 text-emerald-300",
				icon: TipsIcon,
			},
			{
				label: "Ingreso Diario",
				value: `$${totalRevenue.toLocaleString()}`,
				helper: "Actualizado ahora",
				accent: "bg-sky-400/20 text-sky-300",
				icon: RevenueIcon,
			},
		];
	}, [tables, orders]);

	const toggleDropdown = (tableNumber: number) => {
		setOpenDropdown(openDropdown === tableNumber ? null : tableNumber);
	};

	const closeDropdown = () => setOpenDropdown(null);

	const handleLiftTable = async (tableId: string) => {
		try {
			await fetch('/api/tables', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: tableId, available: true }),
			});
			fetchData();
			closeDropdown();
		} catch (error) {
			console.error('Error lifting table:', error);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Auto refresh indicator */}
			<div className="flex items-center justify-end">
				<button 
					onClick={fetchData}
					className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition"
				>
					<RefreshCw className="h-3 w-3" />
					<span>Actualiza cada 30s</span>
				</button>
			</div>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{stats.map((stat) => (
					<article
						key={stat.label}
						className="flex flex-col justify-between h-28 rounded-lg border border-white/10 bg-[#1a1a1f] p-2 px-2"
					>
						<div className="flex items-center justify-between">
							<p className="text-sm tracking-widest text-white/50">{stat.label}</p>
							<div className={`rounded-full p-2 ${stat.accent}`}>
								<stat.icon className="h-5 w-5" />
							</div>
						</div>
						<div className="space-y-2">
							<p className="text-3xl font-medium text-white">{stat.value}</p>
						</div>
					</article>
				))}
			</section>

			<section className="space-y-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="text-lg font-semibold text-white">Estado de mesas</h3>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
					{tables.map((table) => {
						const status = getTableStatus(table);
						const styles = statusStyles[status];
						const tableOrders = getTableOrders(table);
						const isOpen = openDropdown === table.number;
						
						return (
							<article
								key={`mesa-${table.number}`}
								className="relative flex h-[280px] flex-col rounded-lg border border-white/10 bg-[#1a1a1f] p-4"
							>
								<header className="flex items-start justify-between">
									<div>
										<p className="font-serif text-xl text-white italic">Mesa #{table.number}</p>
										<p className="text-xs text-white/40 mt-1">{table.capacity} personas</p>
									</div>
									<div className="relative">
										<button
											type="button"
											onClick={() => toggleDropdown(table.number)}
											className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
											aria-label="Opciones"
										>
											<MoreVertical className="h-4 w-4" />
										</button>
										
										{isOpen && (
											<>
												<div 
													className="fixed inset-0 z-10" 
													onClick={closeDropdown}
													aria-hidden="true"
												/>
												<div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-white/10 bg-[#0f0f15] shadow-xl">
													<div className="py-1">
														<Link
															href={`/dashboard/ordenes?mesa=${table.number}`}
															className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
															onClick={closeDropdown}
														>
															<Plus className="h-4 w-4" />
															Generar Pedido
														</Link>
														<button
															type="button"
															className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
															onClick={closeDropdown}
														>
															<Edit className="h-4 w-4" />
															Editar Pedido
														</button>
														<button
															type="button"
															onClick={() => handleLiftTable(table.id)}
															className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
														>
															<Table2 className="h-4 w-4" />
															Levantar Mesa
														</button>
														<button
															type="button"
															className="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-400 transition hover:bg-white/10"
															onClick={closeDropdown}
														>
															<XCircle className="h-4 w-4" />
															Cancelar Pedido
														</button>
													</div>
												</div>
											</>
										)}
									</div>
								</header>

								<div className="mt-3 flex-1 overflow-y-auto">
									{tableOrders.length > 0 ? (
										<div className="space-y-2">
											{tableOrders.map((order: any) => (
												<div key={order.id} className="rounded-lg bg-white/5 p-2">
													<p className="text-xs text-white/40 mb-1">Orden #{order.orderNumber}</p>
													<ul className="space-y-1 text-sm text-white/70">
														{order.items?.map((item: any, idx: number) => (
															<li key={idx} className="leading-relaxed">
																{item.quantity}x {item.product?.name || 'Producto'}
															</li>
														))}
													</ul>
													<div className="mt-2 flex items-center justify-between">
														<span className="text-xs text-orange-500 font-medium">
															${order.total?.toLocaleString()}
														</span>
														<span className={`text-xs px-2 py-0.5 rounded-full ${
															order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
															order.status === 'PREPARING' ? 'bg-blue-500/20 text-blue-300' :
															order.status === 'READY' ? 'bg-green-500/20 text-green-300' :
															'bg-white/10 text-white/60'
														}`}>
															{order.status === 'PENDING' ? 'Pendiente' :
															 order.status === 'PREPARING' ? 'Preparando' :
															 order.status === 'READY' ? 'Listo' :
															 order.status === 'DELIVERED' ? 'Entregado' : order.status}
														</span>
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm text-white/25">Sin pedidos en curso.</p>
									)}
								</div>

								<div className="mt-4 space-y-2">
									<span className={`text-xs font-semibold uppercase tracking-widest ${styles.label} block`}>
										{styles.text}
									</span>
									<div className={`h-2 w-full rounded-full ${styles.bar}`} />
								</div>
							</article>
						);
					})}
				</div>
			</section>
		</div>
	);
}

function QuickAction({ icon: Icon, label }: { icon: ComponentType<IconProps>; label: string }) {
	return (
		<button
			type="button"
			className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/70 transition hover:border-white/30 hover:bg-white/10"
		>
			<Icon className="h-4 w-4" />
			{label}
		</button>
	);
}

function TablesIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
			<rect x="3" y="5" width="18" height="6" rx="1" />
			<path d="M7 11v8M17 11v8M3 15h18" strokeLinecap="round" />
		</svg>
	);
}

function OrdersIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
			<path d="M8 4h8M6 7h12v13H6z" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M9 10h6M9 13h6M9 16h4" strokeLinecap="round" />
		</svg>
	);
}

function TipsIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
			<path d="M12 3v18" strokeLinecap="round" />
			<path d="M16 7.5c0-1.971-1.79-3.5-4-3.5s-4 1.529-4 3.5S8.79 11 11 11h2c2.21 0 4 1.529 4 3.5S14.21 18 12 18s-4-1.529-4-3.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

function RevenueIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
			<path d="M4 18h16M4 6h16" strokeLinecap="round" />
			<path d="M7 14V6h10v8c0 2.21-1.79 4-4 4h-2c-2.21 0-4-1.79-4-4Z" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M10 10h4" strokeLinecap="round" />
		</svg>
	);
}

function KebabIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
			<circle cx="12" cy="5" r="1.5" />
			<circle cx="12" cy="12" r="1.5" />
			<circle cx="12" cy="19" r="1.5" />
		</svg>
	);
}

