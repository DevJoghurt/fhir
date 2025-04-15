import { defu } from 'defu';
import type { Package } from '#fhirtypes/profiling';
import { useDatabase } from '#imports';
import z, { AnyZodObject } from 'zod';

type RuntimePackageStore = Record<string, Partial<Package>>;

let runtimePackageStore = {} as RuntimePackageStore;

const PROFILING_DB_VERSION = 1; // version of the database schema
const PROFILING_DB_NAME = 'profiling'; // name of the database file

// Zod schema for package
const PackageSchema = z.object({
    identifier: z.string(),
    ingested: z.boolean().optional(),
    status: z.enum(['idle', 'in-process', 'error', 'done']).optional().default('idle'),
    compressed: z.object({
        baseName: z.string(),
        path: z.string(),
    }).optional().nullable(),
    mounted: z.string().nullable().optional(),
    meta: z.object({
        name: z.string(),
        version: z.string().optional(),
        description: z.string().optional(),
        author: z.string().optional(),
        fhirVersions: z.array(z.string()).optional(),
        dependencies: z.record(z.string()).optional(),
    }).optional(),
    files: z.array(z.object({
        type: z.enum(['extension', 'profile', 'codeSystem', 'valueSet', 'searchParameter', 'example']),
        normalizedName: z.string(),
        resource: z.string(),
        path: z.string(),
        snapshot: z.boolean(),
    })).optional()
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
        await db.sql`CREATE TABLE IF NOT EXISTS packages ("identifier" TEXT PRIMARY KEY, "ingested" BOOLEAN, "status" TEXT,  "compressed" TEXT, "mounted" TEXT, "meta" TEXT, "files" TEXT)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_identifier ON packages (identifier)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_identifier ON packages (ingested)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_identifier ON packages (status)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_compressed ON packages (compressed)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_mounted ON packages (mounted)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_mounted ON packages (meta)`;
        // add default packages to the database -> use sqlite JSON functions to store the data
        // check if the package already exists in the database
        const existingPackages = await getPackages();
        // check if the package already exists in the database
        for (const pkg of defaults) {
            const existingPkg = existingPackages.find((p) => p.identifier === pkg.identifier)
            if(!existingPkg){
                console.log(`Adding package ${pkg.identifier} to the database`);
                await db.sql`INSERT INTO packages (identifier, compressed, mounted)
                    VALUES (${pkg.identifier}, ${pkg.compressed ? JSON.stringify(pkg.compressed) : null}, ${pkg.mounted || null})`;
            }else {
                console.log(`Package ${pkg.identifier} already exists in the database`);
            }
        }
    }

    async function getPackages() {
        const packageQuery = db.prepare(`SELECT
            identifier,
            compressed,
            mounted,
            meta
            FROM packages`);
        const existingPackages = await packageQuery.all() as any[];

        // Parse compressed and mounted fields from JSON strings to objects
        const parsedPackages = existingPackages.map(pkg => ({
            ...pkg,
            compressed: pkg.compressed ? JSON.parse(pkg.compressed) : null,
            meta: pkg.meta ? JSON.parse(pkg.meta) : null,
        }));

        // Validate the parsed packages against the schema
        const existingPackagesResult = PackagesSchema.safeParse(parsedPackages);
        if (!existingPackagesResult.success) {
            console.error('Invalid existing packages', existingPackagesResult.error);
            throw new Error('Invalid existing packages');
        }
        return existingPackagesResult?.data || [];
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
            key === 'compressed' || key === 'meta' || key === 'files'
                ? JSON.stringify(pkg[key as keyof Package])
                : pkg[key as keyof Package]
        ) as any;

        const query = `UPDATE packages SET ${updates} WHERE identifier = ?`;
        const stmt = db.prepare(query);
        return stmt.run(...values, identifier);
    }


    return {
        getPackages,
        updatePackage,
        initDatabase
    };
}