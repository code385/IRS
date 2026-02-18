import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

/** UTF-8 BOM for Excel compatibility */
const UTF8_BOM = '\uFEFF';

/**
 * Export CSV content as a downloadable .csv file.
 * On Android/iOS: writes file and shares via expo-sharing (user can save as .csv).
 * On Web: triggers download via Blob.
 */
export async function exportCsvAsFile(csvContent: string, filename: string): Promise<void> {
  const contentWithBom = UTF8_BOM + csvContent;
  const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const finalFilename = safeFilename.endsWith('.csv') ? safeFilename : `${safeFilename}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([contentWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const fileUri = `${FileSystem.cacheDirectory}${finalFilename}`;
  await FileSystem.writeAsStringAsync(fileUri, contentWithBom, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Export ${finalFilename}`,
      });
      return;
    }
  } catch (e: any) {
    if (e?.message?.includes('cancel') || e?.message?.includes('User did not')) return;
  }

  await Share.share({ message: contentWithBom, title: finalFilename });
}
