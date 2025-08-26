import React, { useEffect, useState } from "react";
import axios from "axios";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";
import { createBooking } from "../services/bookingService";
import NavBar from "../components/navBar";
import BookingForm from "../components/bookingManagement/BookingForm";

const Admin: React.FC = () => {
  const { user, token } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [groupBy, setGroupBy] = useState<"day" | "month" | "year">("month");

  // Crear empleado
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", password: "", businessId: "" });
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [employeeSuccess, setEmployeeSuccess] = useState<string | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // Editar empleado
  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  const [editEmployeeLoading, setEditEmployeeLoading] = useState(false);
  const [editEmployeeError, setEditEmployeeError] = useState<string | null>(null);
  const [editEmployeeSuccess, setEditEmployeeSuccess] = useState<string | null>(null);

  // Estado para el formulario de reserva
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Fechas para métricas
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  });

  // Obtener negocios propios
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (user && token) {
        try {
          const res = await axios.get(`http://localhost:3000/admin/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBusinesses(res.data.businesses || []);
          if (res.data.businesses && res.data.businesses.length > 0) {
            setSelectedBusiness(res.data.businesses[0].id);
            setNewEmployee(e => ({ ...e, businessId: res.data.businesses[0].id }));
          }
        } catch (err) {
          // handle error
        }
      }
    };
    fetchBusinesses();
  }, [user, token]);

  const fetchMetrics = async (
    businessId: string,
    from: string,
    to: string,
    userId: string | undefined,
    groupBy: string
  ) => {
    // Normaliza fechas según el tipo de filtro
    let fromParam = from;
    let toParam = to;
    if (groupBy === "year") {
      // Si es año, asegúrate de enviar YYYY
      fromParam = from.slice(0, 4);
      toParam = to.slice(0, 4);
    } else if (groupBy === "month") {
      // Si es mes, asegúrate de enviar YYYY-MM
      fromParam = from.slice(0, 7);
      toParam = to.slice(0, 7);
    }
    const res = await axios.get("http://localhost:3000/admin/metrics", {
      params: {
        businessId,
        userId,
        from: fromParam,
        to: toParam,
        groupBy
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    setMetrics(res.data);
  };
  // Cuando cambia el negocio seleccionado, actualiza métricas y empleados
  useEffect(() => {
    if (!selectedBusiness) return;
    // Fetch metrics
    fetchMetrics(selectedBusiness, fromDate, toDate, user?.id, groupBy);
  }, [selectedBusiness, token, user?.id, fromDate, toDate, groupBy]);

  useEffect(() => {
if (!selectedBusiness || !user?.id || !fromDate || !toDate) return;    // Fetch employees solo del negocio seleccionado
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const res = await axios.get("http://localhost:3000/admin/employees", {
          params: { businessId: selectedBusiness, search, page, limit, authProvider: AuthProvider },
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(res.data.employees);
        setTotalEmployees(res.data.total);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [selectedBusiness, search, page, limit, token, employeeSuccess, editEmployeeSuccess]);

  // Crear empleado
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeError(null);
    setEmployeeSuccess(null);
    setEmployeeLoading(true);
    try {
      await axios.post(
        "http://localhost:3000/admin/employee",
        {
          ...newEmployee,
          role: "EMPLOYEE",
          authProvider: "LOCAL"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEmployeeSuccess("Empleado creado exitosamente.");
      setNewEmployee({ name: "", email: "", password: "", businessId: businesses[0]?.id || "" });
      setShowEmployeeForm(false);
    } catch (err: any) {
      setEmployeeError(
        err.response?.data?.message || "Error al crear el empleado."
      );
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Eliminar empleado
  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este empleado?")) return;
    try {
      await axios.delete(`http://localhost:3000/admin/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(employees.filter(a => a.id !== id));
      setTotalEmployees(totalEmployees - 1);
    } catch (err) {
      alert("Error al eliminar empleado");
    }
  };

  // Editar empleado
  const handleEditClick = (employee: any) => {
    setEditEmployee({ ...employee, password: "" });
    setEditEmployeeError(null);
    setEditEmployeeSuccess(null);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditEmployeeLoading(true);
    setEditEmployeeError(null);
    setEditEmployeeSuccess(null);
    try {
      await axios.put(
        `http://localhost:3000/admin/employees/${editEmployee.id}`,
        {
          name: editEmployee.name,
          email: editEmployee.email,
          password: editEmployee.password || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEditEmployeeSuccess("Empleado actualizado correctamente.");
      setEmployees(employees.map(a => a.id === editEmployee.id ? { ...a, name: editEmployee.name, email: editEmployee.email } : a));
      setTimeout(() => setEditEmployee(null), 1000);
    } catch (err: any) {
      setEditEmployeeError(err.response?.data?.message || "Error al actualizar empleado.");
    } finally {
      setEditEmployeeLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-custom-light to-custom-dark">
      <NavBar />
      <div className="flex flex-col items-center justify-start flex-1 w-full px-4 py-8" style={{ minHeight: "calc(100vh - 48px)" }}>
        <div className="bg-white/90 rounded-xl shadow-lg p-8 w-full max-w-5xl">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Gestión de Empleados</h2>
                  {/* Botón para mostrar formulario de reservas*/}
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={() => BookingForm}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-blue-400"
                    >
                      Crear nueva reserva
                    </button>
                    
                  </div>
          {/* Botón para mostrar formulario */}
          {!showEmployeeForm ? (
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setShowEmployeeForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-blue-400"
              >
                Crear nuevo empleado
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateEmployee} className="flex flex-col gap-4 max-w-md mx-auto mb-6">
              <select
                value={newEmployee.businessId}
                onChange={e => setNewEmployee({ ...newEmployee, businessId: e.target.value })}
                required
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400"
              >
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Nombre"
                value={newEmployee.name}
                onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                required
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmployee.email}
                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                required
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={newEmployee.password}
                onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                required
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={employeeLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 flex-1 rounded-lg transition-colors focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                >
                  {employeeLoading ? "Creando..." : "Crear Empleado"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmployeeForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 flex-1 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
              {employeeError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
                  {employeeError}
                </div>
              )}
              {employeeSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center">
                  {employeeSuccess}
                </div>
              )}
            </form>
          )}

          {/* Selector de negocio y métricas */}
          <div className="mb-6">
            <select
              value={selectedBusiness}
              onChange={e => setSelectedBusiness(e.target.value)}
              className="mb-4 px-4 py-2 rounded-lg border border-gray-300"
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {/* Filtros por fecha */}
            <div className="flex gap-2 mb-4 items-center">
              <label>Filtrar por:</label>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as "day" | "month" | "year")}
                className="border rounded px-2 py-1"
              >
                <option value="day">Día</option>
                <option value="month">Mes</option>
                <option value="year">Año</option>
              </select>
              <label>Desde:</label>
              <input
                type={groupBy === "day" ? "date" : groupBy === "month" ? "month" : "number"}
                min={groupBy === "year" ? "2000" : undefined}
                max={groupBy === "year" ? "2100" : undefined}
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="border rounded px-2 py-1"
                placeholder={groupBy === "year" ? "Año" : ""}
              />
              <label>Hasta:</label>
              <input
                type={groupBy === "day" ? "date" : groupBy === "month" ? "month" : "number"}
                min={groupBy === "year" ? "2000" : undefined}
                max={groupBy === "year" ? "2100" : undefined}
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="border rounded px-2 py-1"
                placeholder={groupBy === "year" ? "Año" : ""}
              />
              <button
                onClick={() => fetchMetrics(selectedBusiness, fromDate, toDate, user?.id, groupBy)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Buscar métricas
              </button>
            </div>

            {metrics && (
              <div className="mb-6">
                <div className="flex gap-4 mb-4">
                  <div className="bg-blue-100 rounded-lg p-4 flex-1 text-center">
                    <div className="text-2xl font-bold">{metrics.totalBookings ?? 0}</div>
                    <div>Turnos</div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-4 flex-1 text-center">
                    <div className="text-2xl font-bold">
                      ${metrics.totalRevenue?.toLocaleString() ?? 0}
                    </div>
                    <div>Ingresos</div>
                  </div>
                </div>

                {/* Bookings por mes */}
                <div className="mb-4">
                  <h4 className="font-bold mb-2">Turnos por período</h4>
                  <table className="min-w-full bg-white rounded-lg shadow">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Período</th>
                        <th className="px-4 py-2">Turnos</th>
                        <th className="px-4 py-2">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.bookingsByGroup?.length > 0 ? (
                        metrics.bookingsByGroup.map((g: any) => (
                          <tr key={g.period}>
                            <td className="px-4 py-2">{g.period}</td>
                            <td className="px-4 py-2">{g.totalBookings}</td>
                            <td className="px-4 py-2">${g.totalRevenue?.toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center py-2">Sin datos</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bookings por servicio */}
                <div>
                  <h4 className="font-bold mb-2">Turnos por servicio</h4>
                  <table className="min-w-full bg-white rounded-lg shadow">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Servicio</th>
                        <th className="px-4 py-2">Fecha</th>
                        <th className="px-4 py-2">Precio</th>
                        <th className="px-4 py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.bookingByService?.length > 0 ? (
                        metrics.bookingByService.map((b: any, i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-2">{b.serviceName}</td>
                            <td className="px-4 py-2">{b.date}</td>
                            <td className="px-4 py-2">${b.finalPrice?.toLocaleString()}</td>
                            <td className="px-4 py-2">{b.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-2">Sin datos</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Botón crear reserva y formulario */}
          <div className="mb-6">
            <button
              onClick={() => setShowBookingForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Crear Reserva
            </button>
          </div>

          {/* Modal del formulario de reserva */}
          {showBookingForm && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowBookingForm(false)}
                >✕</button>
                <h3 className="text-xl font-bold mb-4 text-center">Crear Reserva</h3>
                <BookingForm
                  onSubmit={async (bookingData) => {
                    try {
                      // Usamos el servicio en lugar de axios directamente
                      await createBooking({
                        ...bookingData,
                        businessId: selectedBusiness
                      });
                      setBookingSuccess('Reserva creada exitosamente');
                      setShowBookingForm(false);
                    } catch (err) {
                      console.error('Error creating booking:', err);
                      if (err instanceof Error) {
                        setBookingError(err.message);
                      } else if (typeof err === 'object' && err !== null && 'response' in err) {
                        const axiosError = err as { response?: { data?: { message?: string } } };
                        setBookingError(axiosError.response?.data?.message || 'Error al crear la reserva');
                      } else {
                        setBookingError('Error al crear la reserva');
                      }
                    }
                  }}
                  businessId={selectedBusiness}
                />
                
                {bookingError && (
                  <div className="text-red-600 mt-2">{bookingError}</div>
                )}
                {bookingSuccess && (
                  <div className="text-green-600 mt-2">{bookingSuccess}</div>
                )}
              </div>
            </div>
          )}

          {/* Filtros y paginación */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre o email"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full md:w-64"
            />
            <div>
              Página {page} de {Math.max(1, Math.ceil(totalEmployees / limit))}
              <button
                className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >Anterior</button>
              <button
                className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                disabled={page === Math.ceil(totalEmployees / limit) || totalEmployees === 0}
                onClick={() => setPage(page + 1)}
              >Siguiente</button>
            </div>
          </div>
          <table className="min-w-full bg-white rounded-lg shadow mb-8">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Negocio</th>
                <th className="px-4 py-2 text-left">Creado</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingEmployees ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">Cargando...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">No hay empleados.</td>
                </tr>
              ) : employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-2">{employee.name}</td>
                  <td className="px-4 py-2">{employee.email}</td>
                  <td className="px-4 py-2">{employee.businessName || "-"}</td>
                  <td className="px-4 py-2">{new Date(employee.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                    >Eliminar</button>
                    <button
                      onClick={() => handleEditClick(employee)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para editar empleado */}
      {editEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setEditEmployee(null)}
            >✕</button>
            <h3 className="text-xl font-bold mb-4 text-center">Editar Empleado</h3>
            <form onSubmit={handleEditEmployee} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={editEmployee.name}
                onChange={e => setEditEmployee({ ...editEmployee, name: e.target.value })}
                required
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={editEmployee.email}
                onChange={e => setEditEmployee({ ...editEmployee, email: e.target.value })}
                required
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="password"
                placeholder="Nueva contraseña (opcional)"
                value={editEmployee.password}
                onChange={e => setEditEmployee({ ...editEmployee, password: e.target.value })}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={editEmployeeLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              >
                {editEmployeeLoading ? "Guardando..." : "Guardar cambios"}
              </button>
              {editEmployeeError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-center">
                  {editEmployeeError}
                </div>
              )}
              {editEmployeeSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center">
                  {editEmployeeSuccess}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;