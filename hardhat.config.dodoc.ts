
import { HardhatUserConfig } from 'hardhat/types';
import baseConfig from './hardhat.config';

/**
 * Dodoc has been moved to a separate config file to avoid conflicts with other plugins.
 */
import '@primitivefi/hardhat-dodoc';

export default {
  ...baseConfig,
}