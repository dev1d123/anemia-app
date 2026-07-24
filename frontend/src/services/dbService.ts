import { SQLiteDatabase } from 'expo-sqlite';

// --- INTERFACES DE TYPESCRIPT ---

export interface Ecorregion {
  id_ecorregion?: number;
  nombre: string;
  descripcion?: string;
}

export interface Alimento {
  id_alimento?: number;
  nombre: string;
  categoria: string; // Ej. 'Carne/Víscera', 'Pseudocereal', 'Fruta', 'Legumbre'
  propiedad_destacada?: string;
  estado_nutricional_objetivo?: string; // Ej. 'Anemia Ferropénica', 'Desnutrición Crónica'
  energia_kcal: number;
  proteinas_g: number;
  grasas_totales_g: number;
  carbohidratos_g: number;
  fibra_dietaria_g: number;
  hierro_heminico_mg: number;
  hierro_no_heminico_mg: number;
  vitamina_c_mg: number;
  calcio_mg: number;
  zinc_mg: number;
  sodio_mg: number;
  es_bajo_costo: number; // 0 o 1 en SQLite para boolean
  precio_estimado_por_kg?: number;
  estacionalidad_alta?: string;
  tiempo_conservacion_dias?: number;
  contiene_gluten: number; // 0 o 1 en SQLite para boolean
  alergeno_comun?: string;
  apto_vegano?: number;
  indice_glucemico_estimado?: number;
  preparacion_sugerida?: string;
}

export interface AlimentoEcorregion {
  id_alimento: number;
  id_ecorregion: number;
}

export interface Sustitucion {
  id_sustitucion?: number;
  id_alimento_original: number;
  id_alimento_sustituto: number;
  ratio_equivalencia_g: number;
  ahorro_estimado_porcentaje?: number;
  motivo_clinico?: string;
}

export interface DetalleSustitucion extends Sustitucion {
  alimento_original_nombre: string;
  alimento_original_precio: number;
  alimento_sustituto_nombre: string;
  alimento_sustituto_precio: number;
  alimento_sustituto_hierro_heminico: number;
  alimento_sustituto_hierro_no_heminico: number;
}

export interface HistorialDieta {
  id_historial?: number;
  paciente_id: string;
  paciente_nombre: string;
  hb_status: string;
  fecha: string;
  tipo_dieta: string; // 'Recomendada' o 'Personalizada'
  detalle_dieta: string; // JSON String conteniendo receta o alimentos
}

export interface Diagnostico {
  id_diagnostico?: number;
  paciente_id: string;
  paciente_nombre: string;
  fecha: string;
  imagen_ruta: string;
  hb_estimado: number;
  nivel_anemia: string; // 'Normal' | 'Moderada' | 'Severa'
  confianza: number;
  modelo_version: string;
  sincronizado: number; // 0 o 1
  metadata: string; // JSON string con info de preprocesamiento
}

// --- SERVICIO DE BASE DE DATOS ---

export const dbService = {
  /**
   * Inicializa las tablas de la base de datos local y realiza el sembrado de datos si están vacías.
   */
  async initializeDatabase(db: SQLiteDatabase): Promise<void> {
    try {
      console.log('[SQLite] Habilitando llaves foráneas y creando tablas...');
      await db.execAsync('PRAGMA foreign_keys = ON;');

      // 1. Tabla de Ecorregiones (11 Ecorregiones de Antonio Brack Egg)
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ecorregiones (
        id_ecorregion INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT
      );
    `);

      // 2. Tabla de Alimentos Compleja (Campos añadidos: apto_vegano, indice_glucemico_estimado, preparacion_sugerida)
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS alimentos (
        id_alimento INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        categoria TEXT NOT NULL,
        propiedad_destacada TEXT,
        estado_nutricional_objetivo TEXT,
        energia_kcal REAL DEFAULT 0.0,
        proteinas_g REAL DEFAULT 0.0,
        grasas_totales_g REAL DEFAULT 0.0,
        carbohidratos_g REAL DEFAULT 0.0,
        fibra_dietaria_g REAL DEFAULT 0.0,
        hierro_heminico_mg REAL DEFAULT 0.0,
        hierro_no_heminico_mg REAL DEFAULT 0.0,
        vitamina_c_mg REAL DEFAULT 0.0,
        calcio_mg REAL DEFAULT 0.0,
        zinc_mg REAL DEFAULT 0.0,
        sodio_mg REAL DEFAULT 0.0,
        es_bajo_costo INTEGER DEFAULT 0,
        precio_estimado_por_kg REAL,
        estacionalidad_alta TEXT,
        tiempo_conservacion_dias INTEGER,
        contiene_gluten INTEGER DEFAULT 0,
        alergeno_comun TEXT,
        apto_vegano INTEGER DEFAULT 0,
        indice_glucemico_estimado REAL,
        preparacion_sugerida TEXT
      );
    `);

      // 3. Tabla Relacional: Alimentos por Ecorregión
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS alimento_ecorregion (
        id_alimento INTEGER,
        id_ecorregion INTEGER,
        PRIMARY KEY (id_alimento, id_ecorregion),
        FOREIGN KEY (id_alimento) REFERENCES alimentos(id_alimento) ON DELETE CASCADE,
        FOREIGN KEY (id_ecorregion) REFERENCES ecorregiones(id_ecorregion) ON DELETE CASCADE
      );
    `);

      // 4. Tabla de Sustituciones de Bajo Costo (Campo añadido: impacto_sabor)
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sustituciones (
        id_sustitucion INTEGER PRIMARY KEY AUTOINCREMENT,
        id_alimento_original INTEGER,
        id_alimento_sustituto INTEGER,
        ratio_equivalencia_g REAL,
        ahorro_estimado_porcentaje REAL,
        motivo_clinico TEXT,
        impacto_sabor TEXT,
        FOREIGN KEY (id_alimento_original) REFERENCES alimentos(id_alimento) ON DELETE CASCADE,
        FOREIGN KEY (id_alimento_sustituto) REFERENCES alimentos(id_alimento) ON DELETE CASCADE
      );
    `);

      // 5. Tabla de Historial de Dietas
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS historial_dietas (
        id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id TEXT NOT NULL,
        paciente_nombre TEXT NOT NULL,
        hb_status TEXT NOT NULL,
        fecha TEXT NOT NULL,
        tipo_dieta TEXT NOT NULL,
        detalle_dieta TEXT NOT NULL
      );
    `);

      // 6. Tabla de Diagnósticos (Módulo 1)
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS diagnosticos (
        id_diagnostico INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id TEXT NOT NULL,
        paciente_nombre TEXT NOT NULL,
        fecha TEXT NOT NULL,
        imagen_ruta TEXT NOT NULL,
        hb_estimado REAL NOT NULL,
        nivel_anemia TEXT NOT NULL,
        confianza REAL NOT NULL,
        modelo_version TEXT NOT NULL,
        sincronizado INTEGER DEFAULT 0,
        metadata TEXT DEFAULT '{}'
      );
    `);

      console.log('[SQLite] Tablas listas. Verificando datos para sembrado...');

      // --- SEMBRADO DE ECORREGIONES ---
      const ecorregionesCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM ecorregiones'
      );

      if (ecorregionesCount?.count === 0) {
        console.log('[SQLite] Sembrando las 11 ecorregiones del Perú...');
        const ecorregiones = [
          ['Mar Tropical', 'Aguas cálidas en el norte (Piura y Tumbes).'],
          [
            'Mar Frío de la Corriente Peruana',
            'Aguas frías ricas en plancton (desde Piura hasta Tacna).',
          ],
          ['Desierto del Pacífico', 'Franja costera árida desde Piura hasta Tacna.'],
          ['Bosque Seco Ecuatorial', 'Ecosistema seco en Tumbes, Piura, Lambayeque y La Libertad.'],
          ['Bosque Tropical del Pacífico', 'Pequeña zona selvática y lluviosa en Tumbes.'],
          ['Serranía Esteparia', 'Vertiente occidental de los Andes, clima seco y templado.'],
          ['Puna y los Altos Andes', 'Zonas de gran altitud (sobre 3800 msnm), clima muy frío.'],
          ['Páramo', 'Zonas andinas frías y húmedas en el norte (Piura y Cajamarca).'],
          ['Selva Alta (Yungas)', 'Bosques nubosos en el flanco oriental andino, muy biodiversos.'],
          ['Selva Baja (Bosque Tropical Amazónico)', 'Llanura amazónica, clima cálido y húmedo.'],
          ['Sabana de Palmeras', 'Llanura húmeda con pastos y palmeras (Madre de Dios).'],
        ];

        for (const eco of ecorregiones) {
          await db.runAsync('INSERT INTO ecorregiones (nombre, descripcion) VALUES (?, ?)', eco);
        }
      }

      // --- SEMBRADO DE ALIMENTOS ---
      const alimentosCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM alimentos'
      );
      if (alimentosCount?.count === 0) {
        console.log('[SQLite] Sembrando 15 alimentos representativos...');

        const alimentos = [
          // 1. Sangrecita de Pollo
          [
            'Sangrecita de Pollo',
            'Víscera',
            'Hierro hemínico de excelente absorción.',
            'Anemia',
            120.0,
            16.0,
            5.0,
            0.0,
            0.0,
            29.5,
            0.0,
            0.0,
            15.0,
            3.5,
            80.0,
            1,
            5.0,
            'Todo el año',
            1,
            0,
            'Ninguno',
            0,
            0.0,
            'Guiso con cebollita china',
          ],
          // 2. Hígado de Vacuno
          [
            'Hígado de Vacuno',
            'Víscera',
            'Rico en hierro y vitamina A.',
            'Anemia',
            135.0,
            20.0,
            4.5,
            3.8,
            0.0,
            8.8,
            0.0,
            20.0,
            10.0,
            4.0,
            75.0,
            0,
            18.0,
            'Todo el año',
            2,
            0,
            'Ninguno',
            0,
            0.0,
            'A la plancha o encebollado',
          ],
          // 3. Carne de Res (Lomo)
          [
            'Carne de Res Lomo',
            'Carne',
            'Proteínas de alto valor biológico.',
            'Desnutrición',
            250.0,
            26.0,
            15.0,
            0.0,
            0.0,
            3.0,
            0.0,
            0.0,
            18.0,
            4.5,
            60.0,
            0,
            35.0,
            'Todo el año',
            3,
            0,
            'Ninguno',
            0,
            0.0,
            'Guiso o a la parrilla',
          ],
          // 4. Quinua
          [
            'Quinua',
            'Pseudocereal',
            'Aminoácidos esenciales completos.',
            'Desnutrición',
            368.0,
            14.1,
            6.0,
            64.0,
            7.0,
            0.0,
            4.6,
            0.0,
            47.0,
            3.1,
            5.0,
            1,
            8.0,
            'Todo el año',
            365,
            0,
            'Ninguno',
            1,
            53.0,
            'Graneada o en guisos',
          ],
          // 5. Camu Camu
          [
            'Camu Camu',
            'Fruta',
            'Máxima concentración de vitamina C.',
            'Deficiencia Inmune',
            24.0,
            0.4,
            0.2,
            5.0,
            1.1,
            0.0,
            0.5,
            2780.0,
            28.0,
            0.1,
            1.0,
            0,
            12.0,
            'Nov-Mar',
            5,
            0,
            'Ninguno',
            1,
            25.0,
            'Jugo natural fresco',
          ],
          // 6. Lentejas
          [
            'Lentejas',
            'Legumbre',
            'Rica en hierro no hemínico y fibra.',
            'Anemia',
            116.0,
            9.0,
            0.4,
            20.0,
            8.0,
            0.0,
            3.3,
            1.5,
            19.0,
            1.3,
            2.0,
            1,
            6.0,
            'Todo el año',
            180,
            0,
            'Ninguno',
            1,
            30.0,
            'Guiso acompañado de cítricos',
          ],
          // 7. Anchoveta
          [
            'Anchoveta',
            'Pescado',
            'Alto en Omega 3 (DHA/EPA).',
            'Salud Cardiovascular',
            140.0,
            19.0,
            6.0,
            0.0,
            0.0,
            2.5,
            0.0,
            0.0,
            60.0,
            1.5,
            120.0,
            1,
            4.0,
            'Todo el año',
            2,
            0,
            'Pescado',
            0,
            0.0,
            'Enlatado o fresco en ceviche',
          ],
          // 8. Tarwi (Chocho)
          [
            'Tarwi',
            'Legumbre',
            'Altísimo contenido de proteínas y calcio.',
            'Osteopenia/Desnutrición',
            495.0,
            44.3,
            16.4,
            28.2,
            7.1,
            0.0,
            6.1,
            0.0,
            105.0,
            4.5,
            15.0,
            1,
            10.0,
            'May-Ago',
            7,
            0,
            'Ninguno',
            1,
            15.0,
            'Ceviche de chocho o guisos',
          ],
          // 9. Maca
          [
            'Maca',
            'Tubérculo',
            'Energizante natural y regulador hormonal.',
            'Fatiga Crónica',
            325.0,
            14.0,
            2.2,
            59.0,
            8.5,
            0.0,
            15.0,
            2.5,
            250.0,
            3.8,
            18.0,
            0,
            25.0,
            'Jun-Jul',
            365,
            0,
            'Ninguno',
            1,
            40.0,
            'Polvo en batidos o hervida',
          ],
          // 10. Sacha Inchi
          [
            'Sacha Inchi',
            'Semilla',
            'Fuente vegetal superior de Omega 3.',
            'Salud Cardiovascular',
            570.0,
            29.0,
            54.0,
            13.0,
            5.0,
            0.0,
            0.0,
            0.0,
            240.0,
            0.0,
            10.0,
            0,
            45.0,
            'Todo el año',
            180,
            0,
            'Frutos secos',
            1,
            15.0,
            'Aceite en crudo o semillas tostadas',
          ],
          // 11. Aguaymanto
          [
            'Aguaymanto',
            'Fruta',
            'Alto en antioxidantes y vitamina A.',
            'Estrés Oxidativo',
            49.0,
            1.5,
            0.5,
            11.0,
            2.9,
            0.0,
            1.2,
            43.0,
            9.0,
            0.4,
            1.0,
            0,
            15.0,
            'Todo el año',
            7,
            0,
            'Ninguno',
            1,
            20.0,
            'Fresco o en ensaladas',
          ],
          // 12. Carne de Cuy
          [
            'Carne de Cuy',
            'Carne',
            'Baja en grasa, alta en proteína.',
            'Recuperación Muscular',
            96.0,
            19.0,
            1.6,
            0.0,
            0.0,
            1.9,
            0.0,
            0.0,
            29.0,
            2.0,
            65.0,
            0,
            30.0,
            'Todo el año',
            3,
            0,
            'Ninguno',
            0,
            0.0,
            'Al horno o en guiso',
          ],
          // 13. Paiche
          [
            'Paiche',
            'Pescado',
            'Pescado blanco magro de alta digestibilidad.',
            'Desnutrición',
            105.0,
            20.0,
            2.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            45.0,
            1.2,
            40.0,
            0,
            25.0,
            'Mar-Nov',
            2,
            0,
            'Pescado',
            0,
            0.0,
            'A la parrilla o en ceviche amazónico',
          ],
          // 14. Kiwicha (Amaranto)
          [
            'Kiwicha',
            'Pseudocereal',
            'Excelente fuente de calcio y aminoácidos.',
            'Crecimiento Infantil',
            370.0,
            14.5,
            6.5,
            65.0,
            7.5,
            0.0,
            7.5,
            0.0,
            150.0,
            3.5,
            5.0,
            1,
            9.0,
            'Abr-Jun',
            365,
            0,
            'Ninguno',
            1,
            50.0,
            'Hervida como avena o pop',
          ],
          // 15. Cañihua
          [
            'Cañihua',
            'Pseudocereal',
            'Alto en hierro y libre de saponinas.',
            'Anemia/Desnutrición',
            340.0,
            15.0,
            6.0,
            60.0,
            10.0,
            0.0,
            14.0,
            0.0,
            110.0,
            4.0,
            4.0,
            1,
            12.0,
            'May-Jul',
            365,
            0,
            'Ninguno',
            1,
            45.0,
            'En polvo (cañihuaco) o hervida',
          ],
        ];

        const stmtAlimentos = await db.prepareAsync(`
        INSERT INTO alimentos (
          nombre, categoria, propiedad_destacada, estado_nutricional_objetivo, energia_kcal, proteinas_g, grasas_totales_g, carbohidratos_g, fibra_dietaria_g, hierro_heminico_mg, hierro_no_heminico_mg, vitamina_c_mg, calcio_mg, zinc_mg, sodio_mg, es_bajo_costo, precio_estimado_por_kg, estacionalidad_alta, tiempo_conservacion_dias, contiene_gluten, alergeno_comun, apto_vegano, indice_glucemico_estimado, preparacion_sugerida
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

        for (const alimento of alimentos) {
          await stmtAlimentos.executeAsync(alimento);
        }
        await stmtAlimentos.finalizeAsync();

        // --- ASIGNACIÓN DE RELACIONES (Alimentos - Ecorregiones) ---
        console.log('[SQLite] Asignando alimentos a ecorregiones...');

        // Mapeo simple para vincular fácilmente por nombre
        const ecorregionesDB = await db.getAllAsync<{ id_ecorregion: number; nombre: string }>(
          'SELECT id_ecorregion, nombre FROM ecorregiones'
        );
        const mapEco = ecorregionesDB.reduce(
          (acc, curr) => {
            acc[curr.nombre] = curr.id_ecorregion;
            return acc;
          },
          {} as Record<string, number>
        );

        const alimentosDB = await db.getAllAsync<{ id_alimento: number; nombre: string }>(
          'SELECT id_alimento, nombre FROM alimentos'
        );
        const mapAli = alimentosDB.reduce(
          (acc, curr) => {
            acc[curr.nombre] = curr.id_alimento;
            return acc;
          },
          {} as Record<string, number>
        );

        // Array de relaciones: [NombreAlimento, NombreEcorregion]
        const relaciones = [
          ['Sangrecita de Pollo', 'Desierto del Pacífico'],
          ['Sangrecita de Pollo', 'Serranía Esteparia'],
          ['Sangrecita de Pollo', 'Selva Alta (Yungas)'],
          ['Hígado de Vacuno', 'Desierto del Pacífico'],
          ['Hígado de Vacuno', 'Serranía Esteparia'],
          ['Carne de Res Lomo', 'Desierto del Pacífico'],
          ['Carne de Res Lomo', 'Puna y los Altos Andes'],
          ['Quinua', 'Puna y los Altos Andes'],
          ['Quinua', 'Serranía Esteparia'],
          ['Camu Camu', 'Selva Baja (Bosque Tropical Amazónico)'],
          ['Lentejas', 'Desierto del Pacífico'],
          ['Lentejas', 'Serranía Esteparia'],
          ['Anchoveta', 'Mar Frío de la Corriente Peruana'],
          ['Tarwi', 'Puna y los Altos Andes'],
          ['Tarwi', 'Serranía Esteparia'],
          ['Maca', 'Puna y los Altos Andes'],
          ['Sacha Inchi', 'Selva Alta (Yungas)'],
          ['Sacha Inchi', 'Selva Baja (Bosque Tropical Amazónico)'],
          ['Aguaymanto', 'Selva Alta (Yungas)'],
          ['Aguaymanto', 'Serranía Esteparia'],
          ['Carne de Cuy', 'Serranía Esteparia'],
          ['Carne de Cuy', 'Puna y los Altos Andes'],
          ['Paiche', 'Selva Baja (Bosque Tropical Amazónico)'],
          ['Kiwicha', 'Puna y los Altos Andes'],
          ['Kiwicha', 'Serranía Esteparia'],
          ['Cañihua', 'Puna y los Altos Andes'],
        ];

        const stmtRelaciones = await db.prepareAsync(
          'INSERT INTO alimento_ecorregion (id_alimento, id_ecorregion) VALUES (?, ?)'
        );
        for (const [nomAli, nomEco] of relaciones) {
          if (mapAli[nomAli] && mapEco[nomEco]) {
            await stmtRelaciones.executeAsync([mapAli[nomAli], mapEco[nomEco]]);
          }
        }
        await stmtRelaciones.finalizeAsync();

        // --- SEMBRADO DE SUSTITUCIONES ---
        console.log('[SQLite] Generando sustituciones inteligentes...');

        const sustituciones = [
          // Sustituir Carne de Res por Sangrecita
          [
            mapAli['Carne de Res Lomo'],
            mapAli['Sangrecita de Pollo'],
            0.1,
            85.0,
            'Reemplaza proteína y aporta 10 veces más hierro, ideal para combatir anemia gastando mínimo.',
            'Sabor más intenso y textura suave, requiere buen aderezo.',
          ],
          // Sustituir Res por Lentejas (Opción Vegana/Más económica)
          [
            mapAli['Carne de Res Lomo'],
            mapAli['Lentejas'],
            2.5,
            82.0,
            'Alternativa vegetal alta en fibra. Acompañar con vitamina C para absorber el hierro.',
            'Sabor terroso, cambia la textura del plato completamente.',
          ],
          // Sustituir Salmón/Atún caro por Anchoveta (Asumiendo que hubiese Salmón, usamos Res como ejemplo genérico de carne cara aquí)
          [
            mapAli['Carne de Res Lomo'],
            mapAli['Anchoveta'],
            1.0,
            88.0,
            'Cambio de fuente proteica hacia una rica en Omega 3 para salud cardiovascular.',
            'Fuerte sabor a mar, ideal para enlatados o preparaciones ácidas (ceviche).',
          ],
        ];

        const stmtSust = await db.prepareAsync(`
        INSERT INTO sustituciones (id_alimento_original, id_alimento_sustituto, ratio_equivalencia_g, ahorro_estimado_porcentaje, motivo_clinico, impacto_sabor) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);

        for (const sust of sustituciones) {
          // Asegurar que los IDs existan antes de insertar
          if (sust[0] && sust[1]) {
            await stmtSust.executeAsync(sust);
          }
        }
        await stmtSust.finalizeAsync();

        console.log('[SQLite] Sembrado completado exitosamente.');
      }
    } catch (error) {
      console.error('[SQLite] Error al inicializar/sembrar la base de datos:', error);
    }
  },

  // --- MÉTODOS DE CONSULTA (API) ---

  /**
   * Retorna todas las ecorregiones registradas.
   */
  async getEcorregiones(db: SQLiteDatabase): Promise<Ecorregion[]> {
    try {
      return await db.getAllAsync<Ecorregion>('SELECT * FROM ecorregiones ORDER BY nombre ASC;');
    } catch (error) {
      console.error('[SQLite] Error en getEcorregiones:', error);
      return [];
    }
  },

  /**
   * Retorna todos los alimentos.
   */
  async getAlimentos(db: SQLiteDatabase): Promise<Alimento[]> {
    try {
      return await db.getAllAsync<Alimento>('SELECT * FROM alimentos ORDER BY nombre ASC;');
    } catch (error) {
      console.error('[SQLite] Error en getAlimentos:', error);
      return [];
    }
  },

  /**
   * Retorna los alimentos asociados a una ecorregión en específico.
   */
  async getAlimentosPorEcorregion(db: SQLiteDatabase, idEcorregion: number): Promise<Alimento[]> {
    try {
      return await db.getAllAsync<Alimento>(
        `SELECT a.* FROM alimentos a 
         INNER JOIN alimento_ecorregion ae ON a.id_alimento = ae.id_alimento
         WHERE ae.id_ecorregion = ? 
         ORDER BY a.nombre ASC;`,
        [idEcorregion]
      );
    } catch (error) {
      console.error('[SQLite] Error en getAlimentosPorEcorregion:', error);
      return [];
    }
  },

  /**
   * Obtiene las sustituciones recomendadas para un alimento específico (original).
   */
  async getSustituciones(
    db: SQLiteDatabase,
    idAlimentoOriginal: number
  ): Promise<DetalleSustitucion[]> {
    try {
      return await db.getAllAsync<DetalleSustitucion>(
        `SELECT s.*, 
                ao.nombre AS alimento_original_nombre, 
                ao.precio_estimado_por_kg AS alimento_original_precio,
                asub.nombre AS alimento_sustituto_nombre, 
                asub.precio_estimado_por_kg AS alimento_sustituto_precio,
                asub.hierro_heminico_mg AS alimento_sustituto_hierro_heminico,
                asub.hierro_no_heminico_mg AS alimento_sustituto_hierro_no_heminico
         FROM sustituciones s
         INNER JOIN alimentos ao ON s.id_alimento_original = ao.id_alimento
         INNER JOIN alimentos asub ON s.id_alimento_sustituto = asub.id_alimento
         WHERE s.id_alimento_original = ?;`,
        [idAlimentoOriginal]
      );
    } catch (error) {
      console.error('[SQLite] Error en getSustituciones:', error);
      return [];
    }
  },

  /**
   * Inserta un nuevo alimento en la base de datos.
   */
  async insertAlimento(
    db: SQLiteDatabase,
    alimento: Omit<Alimento, 'id_alimento'>
  ): Promise<number> {
    try {
      const result = await db.runAsync(
        `
        INSERT INTO alimentos (
          nombre, categoria, propiedad_destacada, estado_nutricional_objetivo,
          energia_kcal, proteinas_g, grasas_totales_g, carbohidratos_g, fibra_dietaria_g,
          hierro_heminico_mg, hierro_no_heminico_mg, vitamina_c_mg, calcio_mg, zinc_mg, sodio_mg,
          es_bajo_costo, precio_estimado_por_kg, estacionalidad_alta, tiempo_conservacion_dias, contiene_gluten, alergeno_comun
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alimento.nombre,
          alimento.categoria,
          alimento.propiedad_destacada || null,
          alimento.estado_nutricional_objetivo || null,
          alimento.energia_kcal,
          alimento.proteinas_g,
          alimento.grasas_totales_g,
          alimento.carbohidratos_g,
          alimento.fibra_dietaria_g,
          alimento.hierro_heminico_mg,
          alimento.hierro_no_heminico_mg,
          alimento.vitamina_c_mg,
          alimento.calcio_mg,
          alimento.zinc_mg,
          alimento.sodio_mg,
          alimento.es_bajo_costo,
          alimento.precio_estimado_por_kg !== undefined ? alimento.precio_estimado_por_kg : null,
          alimento.estacionalidad_alta || null,
          alimento.tiempo_conservacion_dias !== undefined
            ? alimento.tiempo_conservacion_dias
            : null,
          alimento.contiene_gluten,
          alimento.alergeno_comun || null,
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('[SQLite] Error al insertar alimento:', error);
      throw error;
    }
  },

  /**
   * Vincula un alimento a una ecorregión.
   */
  async vincularAlimentoEcorregion(
    db: SQLiteDatabase,
    idAlimento: number,
    idEcorregion: number
  ): Promise<void> {
    try {
      await db.runAsync(
        'INSERT OR IGNORE INTO alimento_ecorregion (id_alimento, id_ecorregion) VALUES (?, ?);',
        [idAlimento, idEcorregion]
      );
    } catch (error) {
      console.error('[SQLite] Error al vincular alimento con ecorregión:', error);
      throw error;
    }
  },

  /**
   * Inserta una nueva entrada en el historial de dietas.
   */
  async insertHistorialDieta(
    db: SQLiteDatabase,
    registro: Omit<HistorialDieta, 'id_historial'>
  ): Promise<number> {
    try {
      const result = await db.runAsync(
        `
        INSERT INTO historial_dietas (
          paciente_id, paciente_nombre, hb_status, fecha, tipo_dieta, detalle_dieta
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          registro.paciente_id,
          registro.paciente_nombre,
          registro.hb_status,
          registro.fecha,
          registro.tipo_dieta,
          registro.detalle_dieta,
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('[SQLite] Error al insertar en historial_dietas:', error);
      throw error;
    }
  },

  /**
   * Obtiene todo el historial de dietas de un paciente, o todo en general si no se pasa id.
   */
  async getHistorialDietas(db: SQLiteDatabase, pacienteId?: string): Promise<HistorialDieta[]> {
    try {
      if (pacienteId) {
        return await db.getAllAsync<HistorialDieta>(
          'SELECT * FROM historial_dietas WHERE paciente_id = ? ORDER BY id_historial DESC;',
          [pacienteId]
        );
      } else {
        return await db.getAllAsync<HistorialDieta>(
          'SELECT * FROM historial_dietas ORDER BY id_historial DESC;'
        );
      }
    } catch (error) {
      console.error('[SQLite] Error en getHistorialDietas:', error);
      return [];
    }
  },

  /**
   * Elimina un registro del historial.
   */
  async deleteHistorialDieta(db: SQLiteDatabase, idHistorial: number): Promise<void> {
    try {
      await db.runAsync('DELETE FROM historial_dietas WHERE id_historial = ?;', [idHistorial]);
    } catch (error) {
      console.error('[SQLite] Error al eliminar del historial:', error);
      throw error;
    }
  },

  // --- MÉTODOS DE DIAGNÓSTICO (MÓDULO 1) ---

  async insertDiagnostico(
    db: SQLiteDatabase,
    diag: Omit<Diagnostico, 'id_diagnostico'>
  ): Promise<number> {
    try {
      const result = await db.runAsync(
        `
        INSERT INTO diagnosticos (
          paciente_id, paciente_nombre, fecha, imagen_ruta,
          hb_estimado, nivel_anemia, confianza, modelo_version, sincronizado, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          diag.paciente_id,
          diag.paciente_nombre,
          diag.fecha,
          diag.imagen_ruta,
          diag.hb_estimado,
          diag.nivel_anemia,
          diag.confianza,
          diag.modelo_version,
          diag.sincronizado,
          diag.metadata,
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('[SQLite] Error al insertar diagnóstico:', error);
      throw error;
    }
  },

  async getDiagnosticosPorPaciente(db: SQLiteDatabase, pacienteId: string): Promise<Diagnostico[]> {
    try {
      return await db.getAllAsync<Diagnostico>(
        'SELECT * FROM diagnosticos WHERE paciente_id = ? ORDER BY id_diagnostico DESC;',
        [pacienteId]
      );
    } catch (error) {
      console.error('[SQLite] Error en getDiagnosticosPorPaciente:', error);
      return [];
    }
  },

  async getDiagnosticosPendientesSync(db: SQLiteDatabase): Promise<Diagnostico[]> {
    try {
      return await db.getAllAsync<Diagnostico>(
        'SELECT * FROM diagnosticos WHERE sincronizado = 0 ORDER BY id_diagnostico ASC;'
      );
    } catch (error) {
      console.error('[SQLite] Error en getDiagnosticosPendientesSync:', error);
      return [];
    }
  },

  async marcarDiagnosticoSincronizado(db: SQLiteDatabase, idDiagnostico: number): Promise<void> {
    try {
      await db.runAsync('UPDATE diagnosticos SET sincronizado = 1 WHERE id_diagnostico = ?;', [
        idDiagnostico,
      ]);
    } catch (error) {
      console.error('[SQLite] Error al marcar diagnóstico como sincronizado:', error);
      throw error;
    }
  },

  async deleteDiagnostico(db: SQLiteDatabase, idDiagnostico: number): Promise<void> {
    try {
      await db.runAsync('DELETE FROM diagnosticos WHERE id_diagnostico = ?;', [idDiagnostico]);
    } catch (error) {
      console.error('[SQLite] Error al eliminar diagnóstico:', error);
      throw error;
    }
  },
};
