import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterAdminSpaceDto } from './dto/register-admin-space.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerMember(dto: RegisterMemberDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('Username sudah digunakan oleh akun lain!');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          username: dto.username,
          password: hashedPassword,
          role: Role.member,
          member: {
            create: {
              namaMember: dto.nama_member,
              instansi: dto.instansi,
              alamat: dto.alamat,
              telp: dto.telp,
              foto: dto.foto || null,
            },
          },
        },
        include: {
          member: true,
        },
      });
    });

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      message: 'Registrasi member berhasil!',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        member: {
          id: user.member!.id,
          nama_member: user.member!.namaMember,
          instansi: user.member!.instansi,
          alamat: user.member!.alamat,
          telp: user.member!.telp,
          foto: user.member!.foto,
        },
        access_token: token,
      },
    };
  }

  async registerAdminSpace(dto: RegisterAdminSpaceDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('Username sudah digunakan oleh akun lain!');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          username: dto.username,
          password: hashedPassword,
          role: Role.admin_space,
          spaceOwner: {
            create: {
              namaCoworking: dto.nama_coworking,
              namaPemilik: dto.nama_pemilik,
              telp: dto.telp,
              alamat: dto.alamat || null,
              deskripsi: dto.deskripsi || null,
            },
          },
        },
        include: {
          spaceOwner: true,
        },
      });
    });

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      message: 'Registrasi Admin Space berhasil!',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        space_owner: {
          id: user.spaceOwner!.id,
          nama_coworking: user.spaceOwner!.namaCoworking,
          nama_pemilik: user.spaceOwner!.namaPemilik,
          telp: user.spaceOwner!.telp,
          alamat: user.spaceOwner!.alamat,
          deskripsi: user.spaceOwner!.deskripsi,
        },
        access_token: token,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        member: true,
        spaceOwner: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Username atau Password salah!');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      message: 'Login berhasil!',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        member: user.member
          ? {
              id: user.member.id,
              nama_member: user.member.namaMember,
              instansi: user.member.instansi,
              alamat: user.member.alamat,
              telp: user.member.telp,
              foto: user.member.foto,
            }
          : null,
        space_owner: user.spaceOwner
          ? {
              id: user.spaceOwner.id,
              nama_coworking: user.spaceOwner.namaCoworking,
              nama_pemilik: user.spaceOwner.namaPemilik,
              telp: user.spaceOwner.telp,
              alamat: user.spaceOwner.alamat,
              deskripsi: user.spaceOwner.deskripsi,
            }
          : null,
        access_token: token,
      },
    };
  }

  async profile(currentUser: any) {
    return {
      message: 'Berhasil memproses permintaan',
      data: {
        id: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        member: currentUser.member
          ? {
              id: currentUser.member.id,
              nama_member: currentUser.member.namaMember,
              instansi: currentUser.member.instansi,
              alamat: currentUser.member.alamat,
              telp: currentUser.member.telp,
              foto: currentUser.member.foto,
            }
          : null,
        space_owner: currentUser.spaceOwner
          ? {
              id: currentUser.spaceOwner.id,
              nama_coworking: currentUser.spaceOwner.namaCoworking,
              nama_pemilik: currentUser.spaceOwner.namaPemilik,
              telp: currentUser.spaceOwner.telp,
              alamat: currentUser.spaceOwner.alamat,
              deskripsi: currentUser.spaceOwner.deskripsi,
            }
          : null,
      },
    };
  }
}
