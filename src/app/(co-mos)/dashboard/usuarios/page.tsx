"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  UserPlus,
  Users,
  Mail,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Edit,
  Ban,
  CheckCheck,
} from "lucide-react";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

type User = {
  id: string;
  name: string;
  email: string | null;
  document: string;
  role: string;
  active: boolean;
  createdAt: string;
};

type UserFormData = {
  name: string;
  email: string;
  document: string;
  role: string;
  sendEmail: boolean;
};

export default function UsersPage() {
  const router = useRouter();
  const { data: session, status} = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<UserFormData>({
    name: "",
    email: "",
    document: "",
    role: "MESERO",
    sendEmail: true,
  });
  const [editForm, setEditForm] = useState<{ name: string; email: string; role: string }>({
    name: "",
    email: "",
    role: "",
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  }>({ type: "success", title: "", message: "" });
  const [confirmToggle, setConfirmToggle] = useState<{
    show: boolean;
    userId: string | null;
    userName: string | null;
    currentStatus: boolean;
  }>({ show: false, userId: null, userName: null, currentStatus: true });
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setTempPassword(null);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        setModalConfig({
          type: "success",
          title: "Usuario creado",
          message: data.emailSent
            ? `Usuario creado y credenciales enviadas a ${newUser.email}`
            : `Usuario creado. Contraseña temporal: ${data.tempPassword}`,
        });
        
        if (!data.emailSent && data.tempPassword) {
          setTempPassword(data.tempPassword);
        }

        setShowModal(true);
        setNewUser({
          name: "",
          email: "",
          document: "",
          role: "MESERO",
          sendEmail: true,
        });
        setShowNewUserForm(false);
        await fetchUsers();
      } else {
        setModalConfig({
          type: "error",
          title: "Error al crear usuario",
          message: data.error || "No se pudo crear el usuario",
        });
        setShowModal(true);
      }
    } catch (error) {
      setModalConfig({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al crear el usuario",
      });
      setShowModal(true);
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email || "",
      role: user.role,
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        setModalConfig({
          type: "success",
          title: "Usuario actualizado",
          message: "Los cambios se guardaron exitosamente",
        });
        setShowModal(true);
        setShowEditUserModal(false);
        setEditingUser(null);
        await fetchUsers();
      } else {
        setModalConfig({
          type: "error",
          title: "Error al actualizar",
          message: data.error || "No se pudo actualizar el usuario",
        });
        setShowModal(true);
      }
    } catch (error) {
      setModalConfig({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al actualizar el usuario",
      });
      setShowModal(true);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!confirmToggle.userId) return;

    try {
      const response = await fetch(`/api/users/${confirmToggle.userId}`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (response.ok) {
        setModalConfig({
          type: "success",
          title: confirmToggle.currentStatus ? "Usuario desactivado" : "Usuario activado",
          message: data.message || "Estado actualizado exitosamente",
        });
        setShowModal(true);
        await fetchUsers();
      } else {
        setModalConfig({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo cambiar el estado del usuario",
        });
        setShowModal(true);
      }
    } catch (error) {
      setModalConfig({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al cambiar el estado",
      });
      setShowModal(true);
    } finally {
      setConfirmToggle({ show: false, userId: null, userName: null, currentStatus: true });
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: "Administrador",
      MESERO: "Mesero",
      COCINERO: "Cocinero",
      CLIENTE: "Cliente",
    };
    return roles[role] || role;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 rounded-lg bg-zinc-900 border border-zinc-800 p-2 transition hover:border-zinc-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Gestión de Usuarios
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Administra el equipo de tu restaurante
            </p>
          </div>

          <button
            onClick={() => setShowNewUserForm(!showNewUserForm)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 sm:px-4 text-sm font-medium transition hover:bg-orange-600"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* New User Form */}
      {showNewUserForm && (
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-6 animate-fadeIn">
          <h2 className="text-lg font-semibold mb-4">Crear Nuevo Usuario</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium mb-2 block text-gray-300">
                  Nombre Completo *
                </span>
                <input
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                  placeholder="Juan Pérez"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-2 block text-gray-300">
                  Cédula *
                </span>
                <input
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                  placeholder="1234567890"
                  value={newUser.document}
                  onChange={(e) =>
                    setNewUser({ ...newUser, document: e.target.value })
                  }
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-2 block text-gray-300">
                  Email
                </span>
                <input
                  type="email"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                  placeholder="usuario@ejemplo.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-2 block text-gray-300">
                  Rol *
                </span>
                <select
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white focus:border-orange-500 focus:outline-none transition"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  required
                >
                  <option value="MESERO">Mesero</option>
                  <option value="COCINERO">Cocinero</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>
            </div>

            {newUser.email && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newUser.sendEmail}
                  onChange={(e) =>
                    setNewUser({ ...newUser, sendEmail: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-orange-500"
                />
                <Mail className="h-4 w-4 text-white/60" />
                <span className="text-gray-300">
                  Enviar credenciales por email
                </span>
              </label>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Crear Usuario
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowNewUserForm(false)}
                className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm font-medium transition hover:bg-zinc-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List - Responsive */}
      {/* Mobile View - Cards */}
      <div className="block lg:hidden space-y-4">
        {users.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center text-white/40">
            No hay usuarios registrados
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3 ${
                !user.active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{user.name}</h3>
                    {!user.active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs text-red-400">
                        <Ban className="h-3 w-3" />
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60 mt-1">
                    <code>{user.document}</code>
                  </p>
                </div>
              </div>

              {user.email && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Mail className="h-4 w-4 text-white/40" />
                  {user.email}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium">
                  {getRoleLabel(user.role)}
                </span>
                <span className="text-xs text-white/40">
                  {new Date(user.createdAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {(session?.user as any)?.id !== user.id && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-sm text-blue-400 transition hover:bg-blue-500/20"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() =>
                      setConfirmToggle({
                        show: true,
                        userId: user.id,
                        userName: user.name,
                        currentStatus: user.active,
                      })
                    }
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      user.active
                        ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                        : "bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20"
                    }`}
                  >
                    {user.active ? (
                      <>
                        <Ban className="h-4 w-4" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <CheckCheck className="h-4 w-4" />
                        Activar
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden lg:block rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                  Cédula
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                  Fecha
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-white/60">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-zinc-800 transition hover:bg-zinc-800/50 ${
                      !user.active ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">{user.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-white/80">{user.document}</code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white/80">
                        {user.email || (
                          <span className="text-white/40">Sin email</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-1 text-xs text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-1 text-xs text-red-400">
                          <Ban className="h-3 w-3" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white/60">
                        {new Date(user.createdAt).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(session?.user as any)?.id !== user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 text-blue-400 transition hover:bg-blue-500/20"
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmToggle({
                                show: true,
                                userId: user.id,
                                userName: user.name,
                                currentStatus: user.active,
                              })
                            }
                            className={`rounded-lg p-2 transition ${
                              user.active
                                ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                                : "bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20"
                            }`}
                            title={user.active ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {user.active ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <CheckCheck className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-sm text-white/40">
                          Tu cuenta
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium mb-2 block text-gray-300">
                  Nombre Completo
                </span>
                <input
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-2 block text-gray-300">
                  Email
                </span>
                <input
                  type="email"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-2 block text-gray-300">
                  Rol
                </span>
                <select
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white focus:border-orange-500 focus:outline-none transition"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  required
                >
                  <option value="MESERO">Mesero</option>
                  <option value="COCINERO">Cocinero</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm font-medium transition hover:bg-zinc-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Toggle Status Dialog */}
      <ConfirmDialog
        isOpen={confirmToggle.show}
        onClose={() => setConfirmToggle({ show: false, userId: null, userName: null, currentStatus: true })}
        onConfirm={handleToggleUserStatus}
        title={confirmToggle.currentStatus ? "¿Desactivar usuario?" : "¿Activar usuario?"}
        message={
          confirmToggle.currentStatus
            ? `¿Estás seguro de que deseas desactivar a ${confirmToggle.userName}? El usuario no podrá iniciar sesión.`
            : `¿Estás seguro de que deseas activar a ${confirmToggle.userName}? El usuario podrá iniciar sesión nuevamente.`
        }
        confirmText={confirmToggle.currentStatus ? "Desactivar" : "Activar"}
      />

      {/* Success/Error Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setTempPassword(null);
        }}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
}
