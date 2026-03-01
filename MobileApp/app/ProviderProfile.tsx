import React, { useRef } from 'react';
import { 
  StyleSheet, Text, View, Image, ScrollView, 
  TouchableOpacity, Dimensions, SafeAreaView 
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Eyeballed colors from your Figma snips
const COLORS = {
  primary: '#E9B384', // The Tan/Terracotta button color
  text: '#000000',
  subtext: '#4A4A4A',
  background: '#FFFFFF',
  star: '#FFD700',
};

export default function ProviderProfile() {
  const { id } = useLocalSearchParams(); // This gets the provider ID from the URL
  const scrollRef = useRef<ScrollView>(null);
  
  // These refs allow the "Pills" to scroll the page to specific sections
  const qualificationsRef = useRef<View>(null);
  const portfolioRef = useRef<View>(null);
  const ratesRef = useRef<View>(null);

  const scrollToSection = (ref: React.RefObject<View>) => {
    ref.current?.measureLayout(
      scrollRef.current as any,
      (x, y) => scrollRef.current?.scrollTo({ y: y - 20, animated: true })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* This line hides the default Expo Header so we can use our custom image header */}
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView ref={scrollRef} stickyHeaderIndices={[2]}>
        
        {/* HEADER SECTION - Matches snip1.png */}
        <View style={styles.headerContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/600x300' }} 
            style={styles.banner}
          />
          <TouchableOpacity style={styles.iconBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconSearch}>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>

          {/* The Floating Profile Picture */}
          <View style={styles.profilePicWrapper}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/150' }} 
              style={styles.profilePic}
            />
          </View>
        </View>

        {/* STATS & NAME SECTION */}
        <View style={styles.infoSection}>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
               <Ionicons name="star" size={16} color={COLORS.star} /> 4.8 (Rating)
            </Text>
            <Text style={styles.statText}>120+ Completed</Text>
          </View>
          
          <Text style={styles.fullName}>FULL NAME</Text>
          <Text style={styles.description}>
            This is where the provider's bio will go. It matches the text block in your design.
          </Text>
        </View>

        {/* NAVIGATION PILLS - These "Stick" to the top when scrolling */}
        <View style={styles.pillsContainer}>
          <TouchableOpacity style={styles.pill} onPress={() => scrollToSection(qualificationsRef)}>
            <Text style={styles.pillText}>Qualifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => scrollToSection(portfolioRef)}>
            <Text style={styles.pillText}>Portfolio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => scrollToSection(ratesRef)}>
            <Text style={styles.pillText}>Rates</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT SECTIONS */}
        <View style={styles.contentPadding}>
          <View ref={qualificationsRef} style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <Text style={styles.description}>Details about the provider's university or training.</Text>
            <Text style={[styles.sectionTitle, {marginTop: 20}]}>Experience</Text>
            <Text style={styles.description}>Years of work in the field.</Text>
          </View>

          <View ref={portfolioRef} style={styles.section}>
            <Text style={styles.sectionTitle}>Work Name</Text>
            <Image 
              source={{ uri: 'https://via.placeholder.com/400x200' }} 
              style={styles.portfolioImage}
            />
            <Text style={styles.description}>Description of the plumbing or service work shown above.</Text>
          </View>

          <View ref={ratesRef} style={styles.section}>
            <Text style={styles.sectionTitle}>Rates</Text>
            <Text style={styles.description}>Standard pricing information goes here.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { height: 260, position: 'relative' },
  banner: { width: '100%', height: 200 },
  iconBack: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 8 },
  iconSearch: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 8 },
  profilePicWrapper: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    elevation: 5,
  },
  profilePic: { width: 140, height: 140, borderRadius: 15 },
  infoSection: { alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  statText: { fontSize: 14, color: COLORS.subtext, fontWeight: '500' },
  fullName: { fontSize: 28, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  description: { textAlign: 'left', color: COLORS.subtext, lineHeight: 20 },
  pillsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingVertical: 15,
    backgroundColor: COLORS.background, 
  },
  pill: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 25 
  },
  pillText: { fontWeight: '600', fontSize: 14 },
  contentPadding: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  portfolioImage: { width: '100%', height: 200, borderRadius: 20, marginVertical: 10 },
});