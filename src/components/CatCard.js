import React, { memo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import { colors, spacing, radius, typography } from '../utils/theme';

const HeartIcon = ({ filled }) => (
  <Text style={{ fontSize: 18, color: filled ? colors.accent : colors.textSecondary }}>
    {filled ? '♥' : '♡'}
  </Text>
);

const VoteButton = ({ label, onPress, disabled, color }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={disabled ? 1 : 0.7}
    style={[styles.voteBtn, { borderColor: color }, disabled && styles.voteBtnDisabled]}
  >
    <Text style={[styles.voteBtnText, { color }, disabled && styles.voteBtnTextDisabled]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ScoreDisplay = ({ score }) => {
  const scoreColor =
    score > 0 ? colors.scorePositive :
    score < 0 ? colors.scoreNegative :
    colors.scoreNeutral;

  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>Score</Text>
      <Text style={[styles.scoreValue, { color: scoreColor }]}>
        {score > 0 ? `+${score}` : score}
      </Text>
    </View>
  );
};

const CatCard = ({ item, onToggleFavourite, onVote, onDelete, actionLoading }) => {
  const isFavLoading = actionLoading[`fav_${item.id}`];
  const isVoteLoading = actionLoading[`vote_${item.id}`];
  const isDeleteLoading = actionLoading[`delete_${item.id}`];

  const handleDelete = () => {
    Alert.alert(
      'Delete cat?',
      'This will permanently remove the image.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />

        {/* Top-left: delete button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={isDeleteLoading}
          activeOpacity={0.8}
        >
          {isDeleteLoading ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Text style={styles.deleteBtnText}>🗑</Text>
          )}
        </TouchableOpacity>

        {/* Top-right: favourite button */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => onToggleFavourite(item.id, item.favouriteId)}
          disabled={isFavLoading}
          activeOpacity={0.8}
        >
          {isFavLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <HeartIcon filled={item.isFavourited} />
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ScoreDisplay score={item.score} />

        <View style={styles.voteRow}>
          <VoteButton
            label="▲ Up"
            onPress={() => onVote(item.id, 1)}
            disabled={isVoteLoading}
            color={colors.upvote}
          />
          <VoteButton
            label="▼ Down"
            onPress={() => onVote(item.id, 0)}
            // Disabled visually AND functionally when score is at 0
            disabled={isVoteLoading || item.score <= 0}
            color={colors.downvote}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(15,17,23,0.75)',
    borderRadius: radius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 15,
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(15,17,23,0.75)',
    borderRadius: radius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    ...typography.score,
  },
  voteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  voteBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteBtnDisabled: {
    opacity: 0.3,
  },
  voteBtnText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  voteBtnTextDisabled: {
    opacity: 0.5,
  },
});

export default memo(CatCard);