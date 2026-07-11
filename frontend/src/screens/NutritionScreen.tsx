import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { Patient } from '../components/PatientSelector';

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

export const NutritionScreen: React.FC<NutritionScreenProps> = ({ patient }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    // Limpia la receta al cambiar de paciente para forzar interacción
    setSelectedRecipe(null);
  }, [patient]);

  const recipes = RECIPES_DB[patient.hbStatus] || RECIPES_DB['Normal'];

  const handleGenerateRecipe = () => {
    const randomIdx = Math.floor(Math.random() * recipes.length);
    setSelectedRecipe(recipes[randomIdx]);
  };

  const getStatusColor = () => {
    if (patient.hbStatus === 'Normal') return COLORS.secondary;
    if (patient.hbStatus === 'Moderada') return COLORS.warning;
    return COLORS.error;
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Resumen Clínico del Paciente */}
      <View style={styles.card}>
        <View style={styles.patientBar}>
          <Text style={styles.patientBarTitle}>Pauta Nutricional AI</Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusIndicatorText}>{patient.hbStatus}</Text>
          </View>
        </View>

        <Text style={styles.introText}>
          Generación automática de raciones y suplementación con insumos rurales disponibles para{' '}
          <Text style={{ fontWeight: '700' }}>{patient.name}</Text>.
        </Text>

        <View style={styles.suplementoBox}>
          <Ionicons name="medical" size={20} color={COLORS.primary} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.suplementoTitle}>Dosis de Suplementación (Sugerida)</Text>
            <Text style={styles.suplementoDesc}>
              {patient.hbStatus === 'Normal'
                ? 'Gotas preventivas de Sulfato Ferroso: 1 vez a la semana.'
                : patient.hbStatus === 'Moderada'
                ? 'Suplemento de Hierro Terapéutico: 2 mg/kg/día dividido en dos tomas con cítricos.'
                : 'URGENTE: Remitir a centro de salud para tratamiento supervisado y dosificación de hierro.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Selector de Recetas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recetario Local Recomendado</Text>
        <Text style={styles.sectionDesc}>
          Recetas optimizadas con alimentos de fácil acceso y alto contenido de hierro para combatir la anemia rural.
        </Text>

        {!selectedRecipe ? (
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateRecipe}>
            <Ionicons name="restaurant-outline" size={24} color={COLORS.white} />
            <Text style={styles.generateBtnText}>Generar Receta Personalizada</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.recipeBox}>
            <View style={styles.recipeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recipeTitle}>{selectedRecipe.title}</Text>
                <Text style={styles.recipeMeta}>Tiempo: {selectedRecipe.prepTime} • Alto en Hierro</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRecipe(null)}>
                <Ionicons name="close-circle-outline" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <Text style={styles.recipeSub}>Ingredientes Clave:</Text>
            {selectedRecipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingRow}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} />
                <Text style={styles.ingText}>{ing}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <Text style={styles.recipeSub}>Instrucciones de Preparación:</Text>
            <Text style={styles.instructionsText}>{selectedRecipe.instructions}</Text>

            <View style={styles.benefitAlert}>
              <Ionicons name="sparkles" size={16} color={COLORS.primary} />
              <Text style={styles.benefitText}>{selectedRecipe.benefits}</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patientBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusIndicatorText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  introText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 15,
  },
  suplementoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 14,
  },
  suplementoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  suplementoDesc: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  generateBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  recipeBox: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  recipeMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  recipeSub: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ingText: {
    fontSize: 12,
    color: COLORS.text,
  },
  instructionsText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
    textAlign: 'justify',
  },
  benefitAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 15,
  },
  benefitText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
});
