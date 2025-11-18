import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { skills, Skill } from '@/constants/skills';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// Component for each skill item in the list
const SkillItem: React.FC<{ skill: Skill }> = ({ skill }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.skillContainer}>
      <TouchableOpacity
        style={[
          styles.skillButton,
          { backgroundColor: skill.color, opacity: skill.isLocked ? 0.5 : 1 },
        ]}
        disabled={skill.isLocked}
      >
        <MaterialCommunityIcons
          name={skill.icon}
          size={24}
          color={colors.text}
        />
        <Text style={[styles.skillTitle, { color: colors.text }]}>{skill.title}</Text>
      </TouchableOpacity>
      {skill.isLocked && (
        <MaterialCommunityIcons
          name="lock"
          size={20}
          color={colors.text}
          style={styles.lockIcon}
        />
      )}
    </View>
  );
};

// Main screen component
export default function TabOneScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="lightbulb-on" size={40} color="#f1c40f" />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Skillingo</Text>
        <Text style={[styles.userName, { color: colors.text }]}>Ethan</Text>
        <Text style={[styles.streak, { color: colors.text }]}>Streak: 5 Days</Text>
      </View>

      <TouchableOpacity style={styles.startLessonButton}>
        <Text style={styles.startLessonButtonText}>START LESSON</Text>
      </TouchableOpacity>

      {skills.map((skill) => (
        <SkillItem key={skill.id} skill={skill} />
      ))}
    </ScrollView>
  );
}

// Styles for the components
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    marginTop: 10,
  },
  streak: {
    fontSize: 16,
    marginTop: 5,
    color: '#f1c40f',
  },
  startLessonButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 20,
    alignSelf: 'center',
  },
  startLessonButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  skillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    flex: 1,
  },
  skillTitle: {
    fontSize: 18,
    marginLeft: 10,
  },
  lockIcon: {
    marginLeft: 10,
  },
});
