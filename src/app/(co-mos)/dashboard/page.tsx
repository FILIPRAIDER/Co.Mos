"use client";

import { useMemo, type ComponentType, type SVGProps } from "react";
import { useSession } from "next-auth/react";

type TableStatus = "disponible" | "preparacion" | "entrega" | "atencion";

const stats = [
	{
		label: "Mesas Ocupadas",
		value: "4",
		helper: "Salón principal",
		accent: "bg-emerald-400/20 text-emerald-300",
		icon: TablesIcon,
	},
	{
		label: "Pedidos en Curso",
		value: "6",
		helper: "Hoy",
		accent: "bg-amber-400/20 text-amber-300",
		icon: OrdersIcon,
	},
	{
		label: "Propinas Recibidas",
		value: "$275.256,78",
		helper: "Semana actual",
		accent: "bg-emerald-400/20 text-emerald-300",
		icon: TipsIcon,
	},
	{
		label: "Ingreso Diario",
		value: "$275.256,78",
		helper: "Actualizado 10 min",
		accent: "bg-sky-400/20 text-sky-300",
		icon: RevenueIcon,
	},
];

const tables: Array<{
	number: number;
	status: TableStatus;
	orders: string[];
}> = [
	{ number: 1, status: "disponible", orders: [] },
	{ number: 2, status: "preparacion", orders: ["2 Hamburguesas Doble Queso", "1 Coca Cola 400ml"] },
	{ number: 3, status: "disponible", orders: [] },
	{ number: 4, status: "disponible", orders: [] },
	{ number: 5, status: "entrega", orders: ["2 Hamburguesas Doble Queso", "1 Coca Cola 400ml"] },
	{ number: 6, status: "entrega", orders: ["2 Hamburguesas Doble Queso", "1 Coca Cola 400ml"] },
	{ number: 7, status: "disponible", orders: [] },
	{ number: 8, status: "disponible", orders: [] },
	{ number: 9, status: "atencion", orders: ["2 Hamburguesas Doble Queso", "1 Coca Cola 400ml"] },
	{ number: 10, status: "atencion", orders: [] },
];

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

	const firstName = useMemo(() => {
		const full = session?.user?.name?.trim();
		if (!full) return "equipo";
		const [name] = full.split(" ");
		return name || "equipo";
	}, [session?.user?.name]);

	return (
		<div className="space-y-8">
			<section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.7)] backdrop-blur">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-2xl font-semibold text-white">Hola, {firstName} 👋</h2>
						<p className="mt-1 text-sm text-white/60">
							Monitorea tus mesas, pedidos y métricas clave en tiempo real para mantener el servicio al máximo.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
						<QuickAction icon={OrdersIcon} label="Ver órdenes" />
						<QuickAction icon={TablesIcon} label="Mesas" />
						<QuickAction icon={ReportIcon} label="Reportes" />
					</div>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{stats.map((stat) => (
					<article
						key={stat.label}
						className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/50 p-5 shadow-[0_20px_40px_-32px_rgba(0,0,0,0.8)]"
					>
						<div className="flex items-center justify-between">
							<div className={`rounded-full p-2 ${stat.accent}`}>
								<stat.icon className="h-5 w-5" />
							</div>
							<BadgeIcon className="h-5 w-5 text-white/20" />
						</div>
						<div className="mt-6 space-y-2">
							<p className="text-sm uppercase tracking-widest text-white/50">{stat.label}</p>
							<p className="text-3xl font-semibold text-white">{stat.value}</p>
							<p className="text-xs text-white/40">{stat.helper}</p>
						</div>
					</article>
				))}
			</section>

			<section className="space-y-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="text-lg font-semibold text-white">Estado de mesas</h3>
						<p className="text-sm text-white/50">Actualiza en tiempo real las solicitudes de cada mesa.</p>
					</div>
					<button
						type="button"
						className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/70 transition hover:border-white/30 hover:bg-white/10"
					>
						<FilterIcon className="h-4 w-4" />
						Filtrar
					</button>
				</div>

				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
					{tables.map((table) => {
						const styles = statusStyles[table.status];
						return (
							<article
								key={`mesa-${table.number}`}
								className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_20px_50px_-36px_rgba(0,0,0,0.85)]"
							>
								<header className="flex items-start justify-between">
									<div>
										<p className="font-serif text-xl text-white italic">Mesa #{table.number}</p>
									</div>
									<button
										type="button"
										className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
										aria-label="Opciones"
									>
										<KebabIcon className="h-4 w-4" />
									</button>
								</header>

								<div className="mt-3 flex-1">
									{table.orders.length > 0 ? (
										<ul className="space-y-1 text-sm text-white/70">
											{table.orders.map((order, index) => (
												<li key={`${table.number}-order-${index}`} className="leading-relaxed">
													{order}
												</li>
											))}
										</ul>
									) : (
										<p className="text-sm text-white/25">Sin pedidos en curso.</p>
									)}
								</div>

								<div className="mt-4 flex items-center justify-between">
									<span className={`text-xs font-semibold uppercase tracking-widest ${styles.label}`}>
										{styles.text}
									</span>
									<div className={`h-2 w-20 rounded-full ${styles.bar}`} />
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
			<path d="M12 3a6 6 0 0 0-6 6c0 2.22 1.17 4.17 3 5.23V17a3 3 0 0 0 6 0v-2.77c1.83-1.06 3-3.01 3-5.23a6 6 0 0 0-6-6z" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M10 21h4" strokeLinecap="round" />
		</svg>
	);
}

function RevenueIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
			<path d="M5 12.5 9.5 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M5 19h14" strokeLinecap="round" />
		</svg>
	);
}

function ReportIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
			<path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M12 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M9 13h6M9 17h4M9 9h1" strokeLinecap="round" />
		</svg>
	);
}

function BadgeIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
			<circle cx="12" cy="12" r="8" strokeDasharray="2 3" strokeLinecap="round" />
		</svg>
	);
}

function FilterIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
			<path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
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
