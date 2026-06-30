/**
 * Spanish dictionary. `Dictionary` (derived from `en`) enforces that every key
 * is present — a missing key is a compile error.
 */

import type { Dictionary } from './en';

export const es: Dictionary = {
  STATUS_LABELS: {
    pending: 'Pendiente',
    in_progress: 'En curso',
    submitted: 'Enviada',
    done: 'Completada',
  },
  TYPE_LABELS: {
    annual_report: 'Informe anual',
    franchise_tax: 'Impuesto de franquicia',
    boi_report: 'Informe BOI',
    registered_agent_renewal: 'Renovación de agente registrado',
  },
  TRANSITION_LABELS: {
    pending: {
      in_progress: 'Iniciar',
    },
    in_progress: {
      submitted: 'Enviar',
      pending: 'Volver a pendiente',
    },
    submitted: {
      done: 'Marcar como completada',
      in_progress: 'Volver a en curso',
    },
    done: {},
  },
  t: {
    appName: 'Gestor de Obligaciones',
    dashboardTitle: 'Obligaciones',
    create: 'Crear obligación',
    loading: 'Cargando…',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    back: 'Volver a la lista',
    edit: 'Editar',
    delete: 'Eliminar',
    deleting: 'Eliminando…',
    deleteConfirm: '¿Eliminar esta obligación? Esta acción no se puede deshacer.',
    save: 'Guardar',
    saving: 'Guardando…',
    language: 'Idioma',

    kpiTotal: 'Total',
    kpiPending: 'Pendientes',
    kpiInProgress: 'En curso',
    kpiSubmitted: 'Enviadas',
    kpiDone: 'Completadas',
    kpiOverdue: 'Vencidas',
    kpiDueSoon: 'Próximas a vencer',
    kpiAttn: 'Requiere atención',

    filterStatus: 'Estado',
    filterOverdue: 'Vencimiento',
    filterAll: 'Todas',
    filterTitle: 'Título',
    filterTitlePlaceholder: 'Buscar título…',
    filterClear: 'Limpiar filtros',
    sortAsc: 'Ordenar por vencimiento más próximo',
    sortDesc: 'Ordenar por vencimiento más lejano',
    overdueAll: 'Todas',
    overdueOnly: 'Vencidas',
    overdueNot: 'No vencidas',
    noMatchTitle: 'No hay obligaciones coincidentes',
    noMatchBody: 'Ninguna obligación coincide con los filtros actuales.',
    paginationPrev: 'Anterior',
    paginationNext: 'Siguiente',
    rangeOf: 'de',

    colTitle: 'Título',
    colType: 'Tipo',
    colStatus: 'Estado',
    colOwner: 'Responsable',
    colDue: 'Fecha límite',
    overdueTag: 'Vencida',

    emptyTitle: 'Aún no hay obligaciones',
    emptyBody: 'Crea tu primera obligación de cumplimiento para empezar a hacer seguimiento.',
    errorTitle: 'No se pudieron cargar las obligaciones',
    errorBody: 'Algo salió mal al contactar con el servidor.',

    detailDescription: 'Descripción',
    detailDocument: 'Documento',
    docAttached: 'Documento adjunto',
    docMissing: 'Sin documento adjunto',
    docRequired: 'Requerido',
    attach: 'Adjuntar documento',
    detailOwner: 'Responsable',
    detailDue: 'Fecha límite',
    detailType: 'Tipo',
    detailTaxId: 'NIF de la empresa',
    requiresDoc: 'Requiere documento',
    yes: 'Sí',
    no: 'No',

    historyTitle: 'Historial',
    historyEmpty: 'Aún no hay cambios de estado',
    actionsTitle: 'Acciones disponibles',
    actionsNote: 'Las acciones reflejan las transiciones que el servidor permite.',
    noActions: 'No hay acciones disponibles para el estado actual.',
    submitBlockedReason:
      'Debe adjuntarse un documento requerido antes de poder enviar esta obligación.',

    createTitle: 'Crear obligación',
    editTitle: 'Editar obligación',
    fType: 'Tipo',
    fTitle: 'Título',
    fDescription: 'Descripción',
    fDue: 'Fecha límite',
    fOwner: 'Responsable',
    fRequiresDoc: 'Requiere un documento',
    fTaxId: 'NIF de la empresa',
    requiredMark: 'requerido',
    taxidHelp: 'EIN de 9 dígitos (XX-XXXXXXX); el guion es opcional. Se almacena de forma segura y se muestra enmascarado tras guardar.',
    taxidLocked: 'El NIF no se puede cambiar tras la creación.',
    serverErrorBanner: 'No se pudo guardar. Revisa los errores a continuación.',
    toastCreated: 'Obligación creada.',
    toastUpdated: 'Obligación actualizada.',
    toastSaveError: 'No se pudo guardar. Revisa los errores a continuación.',
    toastStatusUpdated: 'Estado actualizado.',
    toastConcurrentModification:
      'Otra persona modificó esta obligación. Mostrando la última versión — revisa y reintenta.',
    toastDocAttached: 'Documento adjuntado.',
    toastActionFailed: 'La acción falló.',
    toastDeleted: 'Obligación eliminada.',

    // Form validation messages (shared by client + server validation).
    vTitleRequired: 'El título es obligatorio.',
    vDueRequired: 'La fecha límite es obligatoria.',
    vDueInvalid: 'Introduce una fecha válida.',
    vOwnerRequired: 'El responsable es obligatorio.',
    vTaxIdRequired: 'El identificador fiscal es obligatorio.',
    vTaxIdFormat: 'Introduce 9 dígitos, p. ej. 12-3456789 (el guion es opcional).',
    validationFailed: 'La validación falló.',

    // Backend error-code messages. `{from}`/`{to}`/`{status}` are interpolated.
    errValidation: 'Revisa los campos resaltados e inténtalo de nuevo.',
    errNotFound: 'Esta obligación ya no existe. Es posible que se haya eliminado.',
    errInvalidTransition: 'No se puede pasar esta obligación de {from} a {to}.',
    errDocumentRequired:
      'Debe adjuntarse un documento requerido antes de poder enviar esta obligación.',
    errHttp: 'El servidor rechazó esta solicitud ({status}).',
    errInternal: 'El servidor encontró un error inesperado. Inténtalo de nuevo.',
    errGeneric: 'Algo salió mal. Inténtalo de nuevo.',
    errBackend: 'Error del servidor ({status}).',
  },
};
