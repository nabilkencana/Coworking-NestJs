import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const imageFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException('Format berkas tidak didukung! Gunakan format .jpg, .jpeg, .png, atau .webp'),
      false,
    );
  }
  callback(null, true);
};

const createStorage = (destinationFolder: string) => {
  return diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads', destinationFolder);
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000000000);
      const ext = extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${timestamp}-${randomSuffix}${ext}`);
    },
  });
};

@ApiTags('Upload')
@Controller('api/upload')
export class UploadController {
  private getBaseUrl(): string {
    return process.env.BASE_URL || 'http://localhost:3000';
  }

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload Berkas Gambar Umum (Multipart Form Data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createStorage('general'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Berkas file wajib diunggah!');
    }

    const baseUrl = this.getBaseUrl();
    return {
      message: 'File berhasil diupload',
      data: {
        filename: file.filename,
        original_name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `${baseUrl}/uploads/general/${file.filename}`,
      },
    };
  }

  @Post('spaces')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload Foto Ruangan / Space Coworking' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createStorage('spaces'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadSpaceImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Berkas file foto space wajib diunggah!');
    }

    const baseUrl = this.getBaseUrl();
    return {
      message: 'Foto space berhasil diupload',
      data: {
        filename: file.filename,
        url: `${baseUrl}/uploads/spaces/${file.filename}`,
      },
    };
  }

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload Foto Profil Member / Pelanggan' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createStorage('members'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadMemberImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Berkas file foto member wajib diunggah!');
    }

    const baseUrl = this.getBaseUrl();
    return {
      message: 'Foto member berhasil diupload',
      data: {
        filename: file.filename,
        url: `${baseUrl}/uploads/members/${file.filename}`,
      },
    };
  }
}
