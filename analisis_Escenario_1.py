import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import os
import sys

def generar_predicciones_excel(archivo_entrada, archivo_salida):
    """
    Lee un CSV con datos de sensores, entrena un árbol de decisión simple 
    y exporta un Excel con las predicciones y probabilidades.
    """
    # 1. Validar y cargar archivo
    if not os.path.exists(archivo_entrada):
        print(f"❌ Error: No se encontró '{archivo_entrada}'")
        sys.exit(1)
        
    print("📥 Cargando datos...")
    df = pd.read_csv(archivo_entrada)
    
    if "temp_cria" not in df.columns:
        print("❌ Error: El archivo debe contener la columna 'temp_cria'")
        sys.exit(1)

    # 2. Preprocesamiento
    df = df.copy()
    df["temp_cria"] = pd.to_numeric(df["temp_cria"], errors="coerce")
    df_inicial = len(df)
    df = df.dropna(subset=["temp_cria"]).copy()
    print(f"🔍 Filas válidas para análisis: {len(df)} (de {df_inicial})")

    # 3. Etiquetado basado en regla biológica (etiqueta real)
    LOW, HIGH = 33.0, 36.0
    df["estado_real"] = df["temp_cria"].apply(
        lambda t: "NORMAL" if LOW <= t <= HIGH else "CRITICO"
    )

    # 4. Entrenamiento del modelo (Árbol de Decisión interpretable)
    X = df[["temp_cria"]]
    y = df["estado_real"]

    clf = DecisionTreeClassifier(max_depth=1, random_state=42)
    clf.fit(X, y)

    # 5. Predicción y cálculo de probabilidad
    df["estado_pred"] = clf.predict(X)
    df["probabilidad"] = clf.predict_proba(X).max(axis=1)

    # 6. Exportar a Excel
    print(f"💾 Guardando resultados en {archivo_salida}...")
    # Reordenar columnas para mejor lectura (opcional)
    cols_prioritarias = ["created_at", "temp_cria", "estado_real", "estado_pred", "probabilidad"]
    cols_ordenadas = [c for c in cols_prioritarias if c in df.columns] + \
                     [c for c in df.columns if c not in cols_prioritarias]
    
    df[cols_ordenadas].to_excel(archivo_salida, index=False, engine="openpyxl")

    # Resumen final
    print("\n✅ Proceso completado exitosamente.")
    print(f"📊 Distribución de predicciones:\n{df['estado_pred'].value_counts().to_string()}")
    print(f"📈 Confianza promedio del modelo: {df['probabilidad'].mean():.2%}")

if __name__ == "__main__":
    generar_predicciones_excel(
        archivo_entrada="datos_1min.csv",      # Archivo de entrada
        archivo_salida="datos_con_prediccion_1min.xlsx"  # Excel de salida
    )