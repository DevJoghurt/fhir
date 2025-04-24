import type { Package } from '#fhirtypes/profiling';
import { useDatabase } from '#imports';
import z from 'zod';

const PROFILING_DB_VERSION = 1; // version of the database schema
const PROFILING_DB_NAME = 'profiling'; // name of the database file

// Zod schema for package
const PackageSchema = z.object({
    identifier: z.string(),
    status: z.object({
        process: z.enum(['idle', 'running', 'completed', 'failed']).optional(),
        downloaded: z.boolean().optional(),
        extracted: z.boolean().optional(),
        loaded: z.boolean().optional(),
        installed: z.boolean().optional(),
    }).nullable().optional(),
    compressedPackage: z.object({
        baseName: z.string(),
        dir: z.string(),
        path: z.string(),
    }).nullable().optional(),
    storage: z.object({
        baseName: z.string(),
        dir: z.string(),
    }).nullable().optional(),
    meta: z.object({
        name: z.string(),
        version: z.string().optional(),
        description: z.string().optional(),
        author: z.string().optional(),
        fhirVersions: z.array(z.string()).optional(),
        dependencies: z.record(z.string()).optional(),
    }).nullable().optional(),
    files: z.array(z.object({
        type: z.enum(['extension', 'profile', 'codeSystem', 'valueSet', 'searchParameter', 'example']),
        name: z.string(),
        status: z.object({
            type: z.enum(['loaded', 'installed', 'failed', 'skipped']),
            message: z.any().optional(),
        }),
        resourceType: z.string(),
        path: z.string(),
        snapshot: z.boolean(),
    })).nullable().optional()
});
// array of packages
const PackagesSchema = z.array(PackageSchema);

export const usePackageStore = () => {

    const db = useDatabase(PROFILING_DB_NAME);

    async function initDatabase(defaults: Package[]) : Promise<void> {
        // add database version to a _meta table
        await db.sql`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)`;
        await db.sql`INSERT OR REPLACE INTO _meta (key, value) VALUES ('version', ${PROFILING_DB_VERSION})`;

        // init package table
        await db.sql`CREATE TABLE IF NOT EXISTS packages ("identifier" TEXT PRIMARY KEY, "status" TEXT,  "compressedPackage" TEXT, "storage" TEXT, "meta" TEXT, "files" TEXT)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_identifier ON packages (identifier)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_status ON packages (status)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_compressed_package ON packages (compressedPackage)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_storage ON packages (storage)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_meta ON packages (meta)`;
        // add default packages to the database -> use sqlite JSON functions to store the data
        // check if the package already exists in the database
        const existingPackages = await getPackages();
        // check if the package already exists in the database
        for (const pkg of defaults) {
            const existingPkg = existingPackages.find((p) => p.identifier === pkg.identifier)
            if(!existingPkg){
                console.log(`Adding package ${pkg.identifier} to the database`);
                await db.sql`INSERT INTO packages (identifier, compressedPackage, storage)
                    VALUES (${pkg.identifier}, ${pkg.compressedPackage ? JSON.stringify(pkg.compressedPackage) : null}, ${JSON.stringify(pkg.storage) || null})`;
            }else {
                console.log(`Package ${pkg.identifier} already exists in the database`);
            }
        }
    }

    function parseAndValidatePackages(packages: any[], columns: (keyof Package)[]) {
        const parsedPackages = packages.map(pkg => {
            const parsedPkg: any = { ...pkg };
            if (columns.includes('status') && pkg.status) {
                parsedPkg.status = JSON.parse(pkg.status);
            }
            if (columns.includes('compressedPackage') && pkg.compressedPackage) {
                parsedPkg.compressedPackage = JSON.parse(pkg.compressedPackage);
            }
            if (columns.includes('storage') && pkg.storage) {
                parsedPkg.storage = JSON.parse(pkg.storage);
            }
            if (columns.includes('meta') && pkg.meta) {
                parsedPkg.meta = JSON.parse(pkg.meta);
            }
            if (columns.includes('files') && pkg.files) {
                parsedPkg.files = JSON.parse(pkg.files);
            }
            return parsedPkg;
        });

        const validationResult = PackagesSchema.safeParse(parsedPackages);
        if (!validationResult.success) {
            console.error('Invalid packages', validationResult.error);
            throw new Error('Invalid packages');
        }
        return validationResult.data;
    }

    async function getPackages(columns: (keyof Package)[] = ['identifier', 'status', 'compressedPackage', 'storage', 'meta']) {
        if (columns.length === 0) {
            throw new Error('At least one column must be specified');
        }

        const selectedColumns = columns.join(', ');
        const packageQuery = db.prepare(`SELECT ${selectedColumns} FROM packages`);
        const existingPackages = await packageQuery.all() as any[];

        return parseAndValidatePackages(existingPackages, columns);
    }

    async function getPackageById(identifier: string, columns: (keyof Package)[] = ['identifier', 'status', 'compressedPackage', 'storage', 'meta']) {
        if (!identifier) {
            throw new Error('Package identifier is required');
        }
        if (columns.length === 0) {
            throw new Error('At least one column must be specified');
        }

        const selectedColumns = columns.join(', ');
        const packageQuery = db.prepare(`SELECT ${selectedColumns} FROM packages WHERE identifier = ?`);
        const packageResult = await packageQuery.get(identifier) as any;

        if (!packageResult) {
            throw new Error(`Package with identifier ${identifier} not found`);
        }

        return parseAndValidatePackages([packageResult], columns)[0];
    }

    async function updatePackage(identifier: string, pkg: Partial<Package>) {
        if (!identifier) {
            throw new Error('Package identifier is required');
        }

        const keys = Object.keys(pkg).filter(key => key !== 'identifier');
        if (keys.length === 0) {
            throw new Error('At least one field must be provided to update');
        }

        const updates = keys.map(key => `${key} = ?`).join(', ');
        const values = keys.map(key =>
           key === 'status' || key === 'compressedPackage' || key === 'storage' || key === 'meta' || key === 'files'
                ? JSON.stringify(pkg[key as keyof Package])
                : pkg[key as keyof Package]
        ) as any;

        const query = `UPDATE packages SET ${updates} WHERE identifier = ?`;
        const stmt = db.prepare(query);
        return stmt.run(...values, identifier);
    }

    return {
        getPackages,
        getPackageById,
        updatePackage,
        initDatabase
    };
}