import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import { uploadImage } from '../services/catApi';
import { colors, spacing, radius, typography } from '../utils/theme';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

// Compress image down until it fits under MAX_SIZE_BYTES.
// Tries quality steps: 80 → 60 → 40. If still too large, rejects.
const compressToLimit = async (asset) => {
  const qualitySteps = [80, 60, 40];

  for (const quality of qualitySteps) {
    const resized = await ImageResizer.createResizedImage(
      asset.uri,
      asset.width ?? 2048,
      asset.height ?? 2048,
      'JPEG',
      quality,
      0,       // rotation
      undefined, // output path — use temp dir
      false,
      { mode: 'contain', onlyScaleDown: true },
    );

    if (resized.size <= MAX_SIZE_BYTES) {
      return {
        uri: resized.uri,
        fileName: resized.name ?? 'cat_compressed.jpg',
        type: 'image/jpeg',
        fileSize: resized.size,
        compressed: true,
        originalSizeMB: (asset.fileSize / 1024 / 1024).toFixed(1),
      };
    }
  }

  // Still too large after max compression — rare, but handle it
  throw new Error(
    'Image is too large to compress under 2 MB. Please choose a smaller photo.',
  );
};

export default function UploadScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [apiError, setApiError] = useState(null);

  const clearErrors = () => {
    setValidationError(null);
    setApiError(null);
  };

  const handlePickImage = () => {
    clearErrors();
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 4096,
        maxWidth: 4096,
        quality: 1, // pick at full quality — we'll compress ourselves if needed
      },
      async (response) => {
        if (response.didCancel || response.errorCode) return;

        const asset = response.assets?.[0];
        if (!asset) return;

        // Validate type
        if (!ALLOWED_MIME_TYPES.includes(asset.type)) {
          setValidationError(
            `Unsupported file type: ${asset.type}. Please use JPG, PNG, GIF, or WebP.`,
          );
          return;
        }

        // If under the limit, use as-is
        if (!asset.fileSize || asset.fileSize <= MAX_SIZE_BYTES) {
          setSelectedImage({ ...asset, compressed: false });
          return;
        }

        // Over 2 MB — compress automatically
        setCompressing(true);
        try {
          const compressed = await compressToLimit(asset);
          setSelectedImage(compressed);
        } catch (err) {
          setValidationError(err.message);
        } finally {
          setCompressing(false);
        }
      },
    );
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      setValidationError('Please select a cat image first.');
      return;
    }

    clearErrors();
    setUploading(true);

    try {
      await uploadImage(selectedImage.uri, selectedImage.fileName, selectedImage.type);

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Gallery');
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Upload failed. Please try again.';
      setApiError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDiscard = () => {
    if (selectedImage) {
      Alert.alert('Discard photo?', 'Your selection will be lost.', [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setSelectedImage(null);
            clearErrors();
          },
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const isBusy = compressing || uploading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={styles.backBtn} disabled={isBusy}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload a Cat</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Drop zone / Preview */}
        <TouchableOpacity
          style={[styles.dropZone, selectedImage && styles.dropZoneWithImage]}
          onPress={handlePickImage}
          activeOpacity={0.8}
          disabled={isBusy}
        >
          {compressing ? (
            <View style={styles.dropZoneInner}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.dropTitle}>Compressing…</Text>
              <Text style={styles.dropHint}>Reducing file size to fit under 2 MB</Text>
            </View>
          ) : selectedImage ? (
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.preview}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.dropZoneInner}>
              <Text style={styles.dropIcon}>🐾</Text>
              <Text style={styles.dropTitle}>Tap to choose a photo</Text>
              <Text style={styles.dropHint}>JPG, PNG, GIF or WebP · Any size</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Compressed notice */}
        {selectedImage?.compressed && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              📦 Compressed from {selectedImage.originalSizeMB} MB to fit the 2 MB limit
            </Text>
          </View>
        )}

        {/* Change photo link */}
        {selectedImage && !isBusy && (
          <TouchableOpacity onPress={handlePickImage} style={styles.changeLink}>
            <Text style={styles.changeLinkText}>Choose a different photo</Text>
          </TouchableOpacity>
        )}

        {/* Validation error */}
        {validationError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {validationError}</Text>
          </View>
        )}

        {/* API error */}
        {apiError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {apiError}</Text>
          </View>
        )}

        {/* Upload button */}
        <TouchableOpacity
          style={[
            styles.uploadBtn,
            (!selectedImage || isBusy) && styles.uploadBtnDisabled,
          ]}
          onPress={handleUpload}
          disabled={!selectedImage || isBusy}
          activeOpacity={0.85}
        >
          {uploading ? (
            <View style={styles.uploadBtnInner}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.uploadBtnText}>Uploading…</Text>
            </View>
          ) : (
            <Text style={styles.uploadBtnText}>Upload cat</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.finePrint}>
          Only images of cats are allowed by the API. Images of other animals
          may be rejected.
        </Text>
      </ScrollView>
    </View>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.titleMd,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  dropZone: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneWithImage: {
    borderStyle: 'solid',
    borderColor: colors.accent,
  },
  dropZoneInner: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropIcon: {
    fontSize: 48,
  },
  dropTitle: {
    ...typography.titleMd,
    color: colors.textPrimary,
  },
  dropHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  noticeBox: {
    backgroundColor: 'rgba(78,205,196,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.success,
  },
  changeLink: {
    alignSelf: 'center',
  },
  changeLinkText: {
    ...typography.caption,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  uploadBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  uploadBtnDisabled: {
    opacity: 0.4,
  },
  uploadBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadBtnText: {
    ...typography.titleSm,
    color: colors.white,
    fontSize: 16,
  },
  finePrint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});