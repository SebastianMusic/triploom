import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { pickImagesFromLibrary } from '@/lib/media-picker';

jest.mock('expo-image-picker', () => ({
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockedGetMediaLibraryPermissionsAsync = jest.mocked(ImagePicker.getMediaLibraryPermissionsAsync);
const mockedRequestMediaLibraryPermissionsAsync = jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync);
const mockedLaunchImageLibraryAsync = jest.mocked(ImagePicker.launchImageLibraryAsync);

describe('pickImagesFromLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens the library immediately when access is already granted', async () => {
    mockedGetMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: 'never',
      status: 'granted',
      accessPrivileges: 'all',
    });
    mockedLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', width: 100, height: 100, type: 'image' }],
    });

    const result = await pickImagesFromLibrary();

    expect(mockedRequestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    expect(mockedLaunchImageLibraryAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ uri: 'file://photo.jpg', width: 100, height: 100, type: 'image' }]);
  });

  it('requests access when the current permission is not yet granted', async () => {
    mockedGetMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      expires: 'never',
      status: 'undetermined',
      accessPrivileges: 'none',
    });
    mockedRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: 'never',
      status: 'granted',
      accessPrivileges: 'all',
    });
    mockedLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', width: 100, height: 100, type: 'image' }],
    });

    await pickImagesFromLibrary();

    expect(mockedRequestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockedLaunchImageLibraryAsync).toHaveBeenCalledTimes(1);
  });

  it('shows the settings alert when access is denied and cannot be requested again', async () => {
    mockedGetMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
      expires: 'never',
      status: 'denied',
      accessPrivileges: 'none',
    });

    const result = await pickImagesFromLibrary();

    expect(mockedRequestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    expect(mockedLaunchImageLibraryAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});
