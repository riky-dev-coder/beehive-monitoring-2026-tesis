import pandas as pd

def procesar_y_agrupar_datos(archivo_entrada, archivo_salida, ventana_tiempo='30min'):
    """
    1. Limpia valores ≤ 0 (los convierte a NaN)
    2. Agrupa los datos en la ventana horaria especificada
    3. Aplica agregaciones específicas por tipo de sensor
    
    Parámetros:
    - ventana_tiempo: Cadena de texto compatible con pandas (ej: '5min', '15min', '30min', '1H', '1D')
    """
    # 1. Cargar datos
    df = pd.read_csv(archivo_entrada)

    # 2. Renombrar columnas
    mapa = {
        'field1': 'temp_cria', 'field2': 'temp_mielera', 'field3': 'temp_exterior',
        'field4': 'humedad_cria', 'field5': 'humedad_mielera', 'field6': 'humedad_exterior',
        'field7': 'peso_total', 'field8': 'peso_mielera'
    }
    df = df.rename(columns=mapa)
    cols_sensores = list(mapa.values())

    # 3. Conversión numérica + limpieza de ≤ 0
    df[cols_sensores] = df[cols_sensores].apply(pd.to_numeric, errors='coerce')
    df[cols_sensores] = df[cols_sensores].where(df[cols_sensores] > 0)  # ≤0 → NaN

    # 4. Eliminar columnas irrelevantes
    df = df.drop(columns=[c for c in ['latitude', 'longitude', 'elevation', 'status'] 
                          if c in df.columns], errors='ignore')

    # 5. Preparar índice temporal (ordenar cronológicamente)
    df['created_at'] = pd.to_datetime(df['created_at'])
    df = df.set_index('created_at').sort_index()

    # 6. Diccionario de agregación por tipo de sensor
    # Temperaturas y Humedad → Promedio de la ventana
    # Peso → Último valor registrado (acumulado al final del intervalo)
    agg_dict = {col: 'mean' for col in cols_sensores if 'peso' not in col}
    agg_dict.update({'peso_total': 'last', 'peso_mielera': 'last'})

    # 7. Resamplear usando la variable de ventana de tiempo
    df_resampleado = df.resample(ventana_tiempo).agg(agg_dict)

    # Eliminar ventanas que no tengan ningún dato válido
    df_resampleado = df_resampleado.dropna(how='all')

    # 8. Guardar resultado
    df_resampleado = df_resampleado.reset_index()
    df_resampleado.to_csv(archivo_salida, index=False)

    # 📊 Resumen
    print(f"✅ Proceso completado.")
    print(f"   📥 Registros originales: {len(df)}")
    print(f"   📤 Ventanas de '{ventana_tiempo}' generadas: {len(df_resampleado)}")
    print(f"   💾 Archivo guardado: {archivo_salida}")

# === EJEMPLOS DE USO ===
if __name__ == "__main__":
    # Ejemplo 1: Ventanas de 5 minutos (por defecto si no pones nada es 30min)
    procesar_y_agrupar_datos(
        archivo_entrada="feeds (1).csv",
        archivo_salida="datos_1min.csv",
        ventana_tiempo='1min'
    )
    print("-" * 10)