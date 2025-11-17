export const patronFecha = /^\d{2}\/\d{2}\/\d{4}$/;

export const parseFecha = (fechaStr) => {
    const [dia, mes, anio] = fechaStr.split('/');
    return new Date(anio, mes - 1, dia);//enero usa 0
};

//Debe usarse la siguiente linea para convertir la fecha
//Que sea comptible con la base de datos postgres
//const fechaInicioISO = inicio.toISOString().split('T')[0];