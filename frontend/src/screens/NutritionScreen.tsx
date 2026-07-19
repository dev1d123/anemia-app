import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { Patient } from '../components/PatientSelector';
import { useSQLiteContext } from 'expo-sqlite';
import { dbService, Alimento, HistorialDieta } from '../services/dbService';

interface NutritionScreenProps {
  patient: Patient;
}

interface Recipe {
  title: string;
  ingredients: string[];
  prepTime: string;
  benefits: string;
  instructions: string;
}

const RECIPES_DB: Record<string, Recipe[]> = {
  Severa: [
    {
      title: 'Papilla de Hígado de Pollo y Zapallo',
      ingredients: ['2 cucharadas de hígado de pollo cocido', 'Trozo pequeño de zapallo andino', '1 cucharadita de aceite de oliva', 'Caldo de verduras (sin sal)'],
      prepTime: '20 min',
      benefits: 'Concentración masiva de Hierro Hemínico de fácil digestión para lactantes.',
      instructions: 'Sancochar el zapallo y el hígado por separado. Aplastarlos con tenedor hasta formar un puré suave. Incorporar la cucharadita de aceite y mezclar uniformemente con el caldo para obtener la textura adecuada.',
    },
    {
      title: 'Puré Fortificado de Sangrecita',
      ingredients: ['3 cucharadas de sangrecita de pollo cocida', '1 papa amarilla mediana', 'Hojas de espinaca cocidas', 'Leche materna o fórmula'],
      prepTime: '15 min',
      benefits: 'El hierro hemínico de la sangrecita tiene un coeficiente de absorción superior al 25%.',
      instructions: 'Licuar o triturar finamente la sangrecita cocida con la papa y espinaca. Añadir un chorro de leche para suavizar la consistencia.',
    },
  ],
  Moderada: [
    {
      title: 'Guisito de Lentejas con Bofe',
      ingredients: ['3 cucharadas de lentejas cocidas', '2 cucharadas de bofe picado en cubitos', 'Zanahoria rallada', 'Cebolla y ajo para aderezo'],
      prepTime: '30 min',
      benefits: 'Combinación óptima de hierro vegetal y animal potenciado por el aderezo.',
      instructions: 'Cocinar las lentejas. Preparar un aderezo base con cebolla y ajo, añadir el bofe hasta dorarlo, luego incorporar las lentejas y la zanahoria rallada con un poco de agua. Dejar cocinar a fuego lento.',
    },
    {
      title: 'Crema de Habas con Sangrecita',
      ingredients: ['Habas secas peladas y cocidas', '2 cucharadas de sangrecita', 'Rama de huacatay', 'Pizca de sal'],
      prepTime: '25 min',
      benefits: 'Rico en proteínas, ácido fólico y hierro para el desarrollo cognitivo.',
      instructions: 'Cocinar las habas hasta que estén muy suaves y triturarlas en puré. Mezclar uniformemente con la sangrecita desmenuzada y aromatizar con huacatay.',
    },
  ],
  Normal: [
    {
      title: 'Mazamorra de Quinua con Durazno',
      ingredients: ['1/2 taza de quinua lavada', '1 durazno picado', 'Canela y clavo de olor', 'Cáscara de naranja'],
      prepTime: '35 min',
      benefits: 'Aporte de carbohidratos complejos, fibra y hierro no hemínico preventivo.',
      instructions: 'Hervir la quinua con canela, clavo y cáscara de naranja. Añadir el durazno picado y cocinar hasta obtener consistencia de mazamorra espesa.',
    },
  ],
};

const FOOD_CATEGORIES = ['Todos', 'Víscera', 'Carne', 'Pseudocereal', 'Fruta', 'Legumbre', 'Pescado', 'Tubérculo', 'Semilla'];

export const NutritionScreen: React.FC<NutritionScreenProps> = ({ patient }) => {
  const db = useSQLiteContext();

  // Estados Generales
  const [activeTab, setActiveTab] = useState<'recomendacion' | 'crear' | 'historial'>('recomendacion');
  const [allFoods, setAllFoods] = useState<Alimento[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(false);

  // Estados de Recomendación AI
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recommendedFoods, setRecommendedFoods] = useState<Alimento[]>([]);

  // Estados de Crear Dieta
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([]);

  // Estados del Historial
  const [historyList, setHistoryList] = useState<HistorialDieta[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Cargar alimentos e historial en el montaje
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingFoods(true);
      try {
        const foods = await dbService.getAlimentos(db);
        setAllFoods(foods);
      } catch (err) {
        console.error('Error al cargar alimentos de SQLite:', err);
      } finally {
        setLoadingFoods(false);
      }
    };
    loadInitialData();
  }, [db]);

  // Cargar historial de dietas al cambiar de paciente o al iniciar
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const hist = await dbService.getHistorialDietas(db, patient.id);
      setHistoryList(hist);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Limpiar estados de selección y recetas al cambiar de paciente
    setSelectedRecipe(null);
    setSelectedFoodIds([]);
  }, [db, patient]);

  // 2. Lógica para generar alimentos recomendados según el diagnóstico
  useEffect(() => {
    if (allFoods.length === 0) return;

    // Filtramos alimentos en base al estado de hemoglobina
    let filtered: Alimento[] = [];
    if (patient.hbStatus === 'Severa' || patient.hbStatus === 'Moderada') {
      // Priorizar alimentos ricos en hierro para anemia
      filtered = allFoods.filter(
        (f) =>
          f.estado_nutricional_objetivo?.toLowerCase().includes('anemia') ||
          f.hierro_heminico_mg > 2.0 ||
          f.hierro_no_heminico_mg > 2.0
      );
    } else {
      // Paciente Normal: enfocado en desarrollo general, pseudocereales y crecimiento
      filtered = allFoods.filter(
        (f) =>
          f.estado_nutricional_objetivo?.toLowerCase().includes('desnutrición') ||
          f.estado_nutricional_objetivo?.toLowerCase().includes('crecimiento') ||
          f.categoria === 'Pseudocereal' ||
          f.categoria === 'Semilla'
      );
    }

    setRecommendedFoods(filtered.slice(0, 4)); // Mostrar top 4
  }, [allFoods, patient.hbStatus]);

  // Manejo de recetas aleatorias
  const handleGenerateRecipe = () => {
    const recipes = RECIPES_DB[patient.hbStatus] || RECIPES_DB['Normal'];
    const randomIdx = Math.floor(Math.random() * recipes.length);
    setSelectedRecipe(recipes[randomIdx]);
  };

  // 3. Registrar recomendación AI en el historial
  const handleSaveRecommendation = async () => {
    const recipes = RECIPES_DB[patient.hbStatus] || RECIPES_DB['Normal'];
    const recipeToSave = selectedRecipe || recipes[0];

    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const detailObj = {
      receta: recipeToSave.title,
      alimentos: recommendedFoods.map((f) => f.nombre),
      sugerenciaSuplemento:
        patient.hbStatus === 'Normal'
          ? 'Gotas preventivas de Sulfato Ferroso.'
          : patient.hbStatus === 'Moderada'
          ? 'Hierro Terapéutico: 2 mg/kg/día.'
          : 'Tratamiento de Hierro urgente en establecimiento.',
    };

    const newRecord: Omit<HistorialDieta, 'id_historial'> = {
      paciente_id: patient.id,
      paciente_nombre: patient.name,
      hb_status: patient.hbStatus,
      fecha: formattedDate,
      tipo_dieta: 'Recomendada',
      detalle_dieta: JSON.stringify(detailObj),
    };

    try {
      await dbService.insertHistorialDieta(db, newRecord);
      Alert.alert('Éxito', `Recomendación para ${patient.name} guardada en el historial local.`);
      fetchHistory(); // Recargar historial
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la recomendación en la base de datos.');
      console.error(err);
    }
  };

  // 4. Crear Dieta personalizada (selección múltiple de alimentos)
  const toggleFoodSelection = (id: number) => {
    setSelectedFoodIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleSaveCustomDiet = async () => {
    if (selectedFoodIds.length === 0) {
      Alert.alert('Alimentos vacíos', 'Por favor, selecciona al menos un alimento del catálogo.');
      return;
    }

    const selectedDetails = allFoods.filter((f) => selectedFoodIds.includes(f.id_alimento!));
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const detailObj = {
      alimentos: selectedDetails.map((f) => ({
        nombre: f.nombre,
        categoria: f.categoria,
        hierro_total: (f.hierro_heminico_mg + f.hierro_no_heminico_mg).toFixed(1),
      })),
    };

    const newRecord: Omit<HistorialDieta, 'id_historial'> = {
      paciente_id: patient.id,
      paciente_nombre: patient.name,
      hb_status: patient.hbStatus,
      fecha: formattedDate,
      tipo_dieta: 'Personalizada',
      detalle_dieta: JSON.stringify(detailObj),
    };

    try {
      await dbService.insertHistorialDieta(db, newRecord);
      Alert.alert(
        'Dieta Registrada',
        `La dieta personalizada se ha guardado en el historial de ${patient.name}.\n\n*Nota: La programación y porciones diarias se realizarán en la siguiente versión.*`
      );
      setSelectedFoodIds([]); // Limpiar selección
      fetchHistory(); // Recargar historial
    } catch (err) {
      Alert.alert('Error', 'No se pudo registrar la dieta en SQLite.');
      console.error(err);
    }
  };

  // 5. Eliminar registro del historial
  const handleDeleteHistoryItem = async (idHistorial: number) => {
    Alert.alert('Eliminar registro', '¿Estás seguro de que deseas eliminar este registro del historial?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await dbService.deleteHistorialDieta(db, idHistorial);
            fetchHistory(); // Recargar historial
          } catch (err) {
            Alert.alert('Error', 'No se pudo eliminar el registro.');
            console.error(err);
          }
        },
      },
    ]);
  };

  // Filtrado de alimentos para la pestaña "Crear Dieta"
  const getFilteredFoods = () => {
    return allFoods.filter((food) => {
      const matchesSearch = food.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (food.propiedad_destacada && food.propiedad_destacada.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'Todos' || food.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  // Colores visuales por estado de hemoglobina
  const getHbStatusColor = (status: string) => {
    if (status === 'Normal') return COLORS.secondary;
    if (status === 'Moderada') return COLORS.warning;
    return COLORS.error;
  };

  const getHbBadgeBg = (status: string) => {
    if (status === 'Normal') return COLORS.secondaryLight;
    if (status === 'Moderada') return '#FFF3CD';
    return COLORS.accentLight;
  };

  return (
    <View style={styles.container}>
      {/* Selector de Pestañas (Tabs) Superior */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'recomendacion' && styles.activeTabButton]}
          onPress={() => setActiveTab('recomendacion')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={activeTab === 'recomendacion' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'recomendacion' && styles.activeTabButtonText]}>
            Recomendación AI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'crear' && styles.activeTabButton]}
          onPress={() => setActiveTab('crear')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add-circle"
            size={16}
            color={activeTab === 'crear' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'crear' && styles.activeTabButtonText]}>
            Crear Dieta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'historial' && styles.activeTabButton]}
          onPress={() => setActiveTab('historial')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="time"
            size={16}
            color={activeTab === 'historial' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'historial' && styles.activeTabButtonText]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info del Paciente Activo */}
      <View style={styles.patientInfoBar}>
        <View style={styles.patientInfoLeft}>
          <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
          <Text style={styles.patientInfoText}>
            Paciente: <Text style={{ fontWeight: '700' }}>{patient.name}</Text> ({patient.age})
          </Text>
        </View>
        <View style={[styles.hbBadge, { backgroundColor: getHbBadgeBg(patient.hbStatus) }]}>
          <Text style={[styles.hbBadgeText, { color: getHbStatusColor(patient.hbStatus) }]}>
            {patient.hb} Hb • {patient.hbStatus}
          </Text>
        </View>
      </View>

      {/* Cuerpos de las Pestañas */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* PESTAÑA 1: RECOMENDACIÓN AI */}
        {activeTab === 'recomendacion' && (
          <View>
            {/* Box Clínico */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Pauta Nutricional Sugerida</Text>
              <Text style={styles.sectionDesc}>
                Basado en el nivel de hemoglobina ({patient.hb} g/dL) de {patient.name}:
              </Text>

              <View style={styles.suplementoBox}>
                <Ionicons name="medical" size={22} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.suplementoTitle}>Dosis de Suplementación</Text>
                  <Text style={styles.suplementoDesc}>
                    {patient.hbStatus === 'Normal'
                      ? 'Hierro profiláctico (prevención): Gotas de Sulfato Ferroso. Administrar 1 vez a la semana.'
                      : patient.hbStatus === 'Moderada'
                      ? 'Hierro terapéutico: Gotas o jarabe (2 mg/kg/día). Dividir en dos tomas y acompañar con jugos ricos en Vitamina C (limón, naranja).'
                      : 'ATENCIÓN CRÍTICA: Remisión prioritaria al Centro de Salud para evaluación médica y dosificación terapéutica supervisada.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Alimentos Recomendados en base al Diagnóstico */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Insumos Locales de Alta Absorción</Text>
              <Text style={styles.sectionDesc}>
                Alimentos recomendados de la ecorregión andina/costera para apoyar el tratamiento de {patient.name}:
              </Text>

              {loadingFoods ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 15 }} />
              ) : (
                <View style={styles.recommendedGrid}>
                  {recommendedFoods.map((food) => (
                    <View key={food.id_alimento} style={styles.foodBadgeCard}>
                      <View style={styles.foodBadgeHeader}>
                        <Ionicons
                          name={food.hierro_heminico_mg > 2.0 ? 'flame' : 'nutrition'}
                          size={16}
                          color={food.hierro_heminico_mg > 2.0 ? COLORS.accent : COLORS.secondary}
                        />
                        <Text style={styles.foodBadgeTitle} numberOfLines={1}>{food.nombre}</Text>
                      </View>
                      <Text style={styles.foodBadgeCategory}>{food.categoria}</Text>
                      <View style={styles.foodBadgeMetrics}>
                        <Text style={styles.foodMetricText}>
                          Hierro: <Text style={{ fontWeight: '700' }}>{(food.hierro_heminico_mg + food.hierro_no_heminico_mg).toFixed(1)} mg</Text>
                        </Text>
                        <Text style={styles.foodMetricText}>Vit. C: {food.vitamina_c_mg} mg</Text>
                      </View>
                      {food.preparacion_sugerida && (
                        <Text style={styles.foodSugerenciaText} numberOfLines={2}>
                          💡 {food.preparacion_sugerida}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Recetas Recomendadas */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recetario Local de Combate</Text>
              <Text style={styles.sectionDesc}>
                Preparaciones locales formuladas con insumos rurales de bajo costo.
              </Text>

              {!selectedRecipe ? (
                <TouchableOpacity style={styles.actionBtn} onPress={handleGenerateRecipe}>
                  <Ionicons name="restaurant" size={18} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>Generar Receta Recomendada</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.recipeBox}>
                  <View style={styles.recipeHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recipeTitle}>{selectedRecipe.title}</Text>
                      <Text style={styles.recipeMeta}>Tiempo de preparación: {selectedRecipe.prepTime}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedRecipe(null)}>
                      <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.recipeSubTitle}>Ingredientes:</Text>
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <View key={idx} style={styles.ingRow}>
                      <Ionicons name="ellipse" size={6} color={COLORS.secondary} style={{ marginRight: 6 }} />
                      <Text style={styles.ingText}>{ing}</Text>
                    </View>
                  ))}

                  <View style={styles.divider} />

                  <Text style={styles.recipeSubTitle}>Instrucciones:</Text>
                  <Text style={styles.recipeInstructions}>{selectedRecipe.instructions}</Text>

                  <View style={styles.benefitBox}>
                    <Ionicons name="sparkles" size={14} color={COLORS.primary} />
                    <Text style={styles.benefitText}>{selectedRecipe.benefits}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.actionBtn, { marginTop: 15, backgroundColor: COLORS.secondary }]}
                    onPress={handleSaveRecommendation}
                  >
                    <Ionicons name="bookmark" size={18} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>Guardar Recomendación en Historial</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* PESTAÑA 2: CREAR DIETA */}
        {activeTab === 'crear' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Composición de Dieta Personalizada</Text>
              <Text style={styles.sectionDesc}>
                Selecciona los alimentos andinos/rurales de la base de datos para planificar la ración.
              </Text>

              {/* Barra de Búsqueda */}
              <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar alimentos por nombre o propiedad..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Categorías (Pills Horizontales) */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                {FOOD_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      selectedCategory === cat && styles.activeCategoryPill,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        selectedCategory === cat && styles.activeCategoryPillText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Listado de Alimentos */}
            <View style={styles.card}>
              <View style={styles.alimentosListHeader}>
                <Text style={styles.sectionSubTitle}>Catálogo de Insumos</Text>
                <Text style={styles.resultsCountText}>
                  {getFilteredFoods().length} alimentos encontrados
                </Text>
              </View>

              {loadingFoods ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 30 }} />
              ) : getFilteredFoods().length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="alert-circle-outline" size={40} color={COLORS.textMuted} />
                  <Text style={styles.emptyStateText}>No se encontraron alimentos con estos filtros.</Text>
                </View>
              ) : (
                <View style={styles.foodsList}>
                  {getFilteredFoods().map((food) => {
                    const isSelected = selectedFoodIds.includes(food.id_alimento!);
                    const ironTotal = food.hierro_heminico_mg + food.hierro_no_heminico_mg;
                    return (
                      <TouchableOpacity
                        key={food.id_alimento}
                        style={[styles.foodRowItem, isSelected && styles.foodRowItemSelected]}
                        onPress={() => toggleFoodSelection(food.id_alimento!)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.foodRowLeft}>
                          <View style={[styles.checkboxContainer, isSelected && styles.checkboxContainerActive]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                          </View>
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.foodRowName}>{food.nombre}</Text>
                            <Text style={styles.foodRowMeta}>
                              {food.categoria} • Estacionalidad: {food.estacionalidad_alta || 'Todo el año'}
                            </Text>
                            {food.es_bajo_costo === 1 && (
                              <View style={styles.lowCostBadge}>
                                <Text style={styles.lowCostBadgeText}>Bajo Costo Rural</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <View style={styles.foodRowRight}>
                          <Text style={styles.foodRowIron}>
                            Fe: <Text style={{ fontWeight: '700' }}>{ironTotal.toFixed(1)} mg</Text>
                          </Text>
                          {food.precio_estimado_por_kg && (
                            <Text style={styles.foodRowPrice}>~S/. {food.precio_estimado_por_kg.toFixed(1)}/kg</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Panel de Dieta Creada / Resumen */}
            {selectedFoodIds.length > 0 && (
              <View style={[styles.card, styles.summaryCard]}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>Resumen de Selección</Text>
                  <Text style={styles.summaryCount}>{selectedFoodIds.length} seleccionados</Text>
                </View>
                <Text style={styles.summaryDesc}>
                  Componiendo ración alimentaria rural para el paciente.
                </Text>

                <TouchableOpacity style={styles.saveDietBtn} onPress={handleSaveCustomDiet}>
                  <Ionicons name="checkbox" size={20} color={COLORS.white} />
                  <Text style={styles.saveDietBtnText}>Registrar Dieta Creada</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* PESTAÑA 3: HISTORIAL */}
        {activeTab === 'historial' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Historial Clínico de Dietas</Text>
              <Text style={styles.sectionDesc}>
                Registro local de dietas guardadas para el paciente activo ({patient.name}).
              </Text>
            </View>

            {loadingHistory ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : historyList.length === 0 ? (
              <View style={[styles.card, styles.emptyStateContainer]}>
                <Ionicons name="folder-open-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyHistoryText}>No hay dietas registradas</Text>
                <Text style={styles.emptyHistorySub}>
                  Genera una recomendación AI o crea una dieta desde las otras pestañas para registrar información.
                </Text>
              </View>
            ) : (
              historyList.map((item) => {
                let parsedDetail: any = {};
                try {
                  parsedDetail = JSON.parse(item.detalle_dieta);
                } catch (e) {
                  parsedDetail = {};
                }

                return (
                  <View key={item.id_historial} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <View>
                        <Text style={styles.historyCardDate}>{item.fecha}</Text>
                        <View style={[
                          styles.dietTypeBadge,
                          { backgroundColor: item.tipo_dieta === 'Recomendada' ? COLORS.primaryLight : '#EADCF7' }
                        ]}>
                          <Text style={[
                            styles.dietTypeBadgeText,
                            { color: item.tipo_dieta === 'Recomendada' ? COLORS.primary : '#6A1B9A' }
                          ]}>
                            Dieta {item.tipo_dieta}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteHistoryBtn}
                        onPress={() => handleDeleteHistoryItem(item.id_historial!)}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    {/* Contenido según tipo de dieta */}
                    {item.tipo_dieta === 'Recomendada' ? (
                      <View>
                        <Text style={styles.historyDetailTitle}>
                          🍳 Receta: <Text style={{ fontWeight: '700', color: COLORS.text }}>{parsedDetail.receta || 'Receta básica'}</Text>
                        </Text>
                        <Text style={styles.historyDetailLabel}>Insumos recomendados:</Text>
                        <Text style={styles.historyDetailContent}>
                          {parsedDetail.alimentos ? parsedDetail.alimentos.join(', ') : 'No especificado'}
                        </Text>
                        {parsedDetail.sugerenciaSuplemento && (
                          <View style={styles.historySuplementoRow}>
                            <Ionicons name="medical" size={14} color={COLORS.primary} />
                            <Text style={styles.historySuplementoText}>
                              {parsedDetail.sugerenciaSuplemento}
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.historyDetailLabel}>Alimentos planificados en la ración:</Text>
                        <View style={styles.historyFoodsGrid}>
                          {parsedDetail.alimentos && parsedDetail.alimentos.map((food: any, idx: number) => (
                            <View key={idx} style={styles.historyFoodItemBadge}>
                              <Text style={styles.historyFoodItemName}>{food.nombre}</Text>
                              <Text style={styles.historyFoodItemFe}>{food.hierro_total} mg Fe</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <View style={[styles.historyFooterBadge, { backgroundColor: getHbBadgeBg(item.hb_status) }]}>
                      <Text style={[styles.historyFooterText, { color: getHbStatusColor(item.hb_status) }]}>
                        Estado Hb registrado: {item.hb_status}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: COLORS.primaryLight,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  patientInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F4F1',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  patientInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientInfoText: {
    fontSize: 12,
    color: COLORS.text,
  },
  hbBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  hbBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContainer: {
    padding: 15,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  suplementoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 5,
  },
  suplementoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 3,
  },
  suplementoDesc: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 17,
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 5,
  },
  foodBadgeCard: {
    width: '48%',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  foodBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  foodBadgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  foodBadgeCategory: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  foodBadgeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    marginBottom: 6,
  },
  foodMetricText: {
    fontSize: 10,
    color: COLORS.text,
  },
  foodSugerenciaText: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 5,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  recipeBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  recipeMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  recipeSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ingText: {
    fontSize: 12,
    color: COLORS.text,
  },
  recipeInstructions: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 17,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 12,
  },
  benefitText: {
    fontSize: 10.5,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeCategoryPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  activeCategoryPillText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  alimentosListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  resultsCountText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  foodsList: {
    gap: 8,
  },
  foodRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  foodRowItemSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondaryLight,
  },
  foodRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainerActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary,
  },
  foodRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  foodRowMeta: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  lowCostBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  lowCostBadgeText: {
    fontSize: 9,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  foodRowRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  foodRowIron: {
    fontSize: 12,
    color: COLORS.text,
  },
  foodRowPrice: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
  },
  emptyStateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  summaryCard: {
    borderColor: COLORS.secondary,
    borderWidth: 1.5,
    backgroundColor: '#FAFDFD',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  summaryDesc: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  saveDietBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  saveDietBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyHistoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 4,
  },
  emptyHistorySub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyCardDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  dietTypeBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dietTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deleteHistoryBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FCEBE6',
  },
  historyDetailTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 5,
  },
  historyDetailLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  historyDetailContent: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
  historySuplementoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 10,
  },
  historySuplementoText: {
    fontSize: 10.5,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  historyFoodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  historyFoodItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  historyFoodItemName: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '500',
  },
  historyFoodItemFe: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  historyFooterBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  historyFooterText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
});
