import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useGallery } from '../hooks/useGallery';
import CatCard from '../components/CatCard';
import { colors, spacing, radius, typography } from '../utils/theme';

const COLUMN_COUNT = 2;
const CARD_GAP = spacing.sm;

export default function Gallery({ navigation }) {
  const { width } = useWindowDimensions();
  const {
    images,
    loading,
    error,
    actionLoading,
    reload,
    toggleFavourite,
    vote,
    removeImage,
  } = useGallery();

  // Reload every time this screen comes into focus (e.g. returning from Upload).
  // This avoids passing a function through navigation params.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Responsive: 1 column on very narrow screens (<380px)
  const numColumns = width < 380 ? 1 : COLUMN_COUNT;
  const cardWidth =
    (width - spacing.md * 2 - CARD_GAP * (numColumns - 1)) / numColumns;

  const renderItem = useCallback(
    ({ item }) => (
      <View style={{ width: cardWidth, marginBottom: CARD_GAP }}>
        <CatCard
          item={item}
          onToggleFavourite={toggleFavourite}
          onVote={vote}
          onDelete={removeImage}
          actionLoading={actionLoading}
        />
      </View>
    ),
    [cardWidth, toggleFavourite, vote, removeImage, actionLoading],
  );

  const keyExtractor = (item) => item.id;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Cats</Text>
          <Text style={styles.headerSubtitle}>
            {images.length} {images.length === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => navigation.navigate('Upload')}
          activeOpacity={0.8}
        >
          <Text style={styles.uploadBtnText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {/* States */}
      {loading && !images.length ? (
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.stateText}>Loading your gallery…</Text>
        </View>
      ) : error ? (
        <View style={styles.centred}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : images.length === 0 ? (
        <View style={styles.centred}>
          <Text style={styles.emptyIcon}>🐱</Text>
          <Text style={styles.emptyTitle}>No cats yet</Text>
          <Text style={styles.stateText}>
            Upload your first cat photo to get started.
          </Text>
          <TouchableOpacity
            style={styles.uploadBtnLarge}
            onPress={() => navigation.navigate('Upload')}
          >
            <Text style={styles.uploadBtnText}>Upload a cat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={
            numColumns > 1 ? { gap: CARD_GAP } : undefined
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={reload}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.displaySm,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  uploadBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  uploadBtnLarge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.lg,
  },
  uploadBtnText: {
    ...typography.titleSm,
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: spacing.sm,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.titleMd,
    color: colors.textPrimary,
  },
  stateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  retryText: {
    ...typography.titleSm,
    color: colors.accent,
  },
});