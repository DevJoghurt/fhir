import type { Package } from '#fhirtypes/profiling';
import { useDatabase } from '#imports';
import z, { set } from 'zod';

const PROFILING_DB_VERSION = 1; // version of the database schema
const PROFILING_DB_NAME = 'profiling'; // name of the database file

// Zod schema for package
const PackageSchema = z.object({
    identifier: z.string(),
    process: z.enum(['idle', 'running', 'waiting']).optional(),
    status: z.object({
        downloaded: z.boolean().optional(),
        extracted: z.boolean().optional(),
        loaded: z.boolean().optional(),
        analyzed: z.boolean().optional(),
        installed: z.boolean().optional(),
    }).nullable().optional(),
    download: z.object({
        name: z.string(),
        version: z.string(),
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
        type: z.enum(['extension', 'profile', 'codeSystem', 'valueSet', 'searchParameter', 'capabilityStatement', 'example']),
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

    async function initDatabase(localPackages: Package[]) : Promise<void> {
        // add database version to a _meta table
        await db.sql`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)`;
        await db.sql`INSERT OR REPLACE INTO _meta (key, value) VALUES ('version', ${PROFILING_DB_VERSION})`;

        // init package table
        await db.sql`CREATE TABLE IF NOT EXISTS packages
            ("identifier" TEXT PRIMARY KEY, "process" TEXT, "status" TEXT, "download" TEXT, "compressedPackage" TEXT, "storage" TEXT, "meta" TEXT, "files" TEXT)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_identifier ON packages (identifier)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_status ON packages (status)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_download ON packages (download)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_compressed_package ON packages (compressedPackage)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_storage ON packages (storage)`;
        await db.sql`CREATE INDEX IF NOT EXISTS idx_packages_meta ON packages (meta)`;
        // add default packages to the database -> use sqlite JSON functions to store the data
        // check if the package already exists in the database
        const existingPackages = await getPackages();
        // check if the package already exists in the database
        for (const pkg of localPackages) {
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
            if (columns.includes('download') && pkg.download) {
                parsedPkg.download = JSON.parse(pkg.download);
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

    async function addDownloadPackage(name: string, version: string) {
        if (!name || !version) {
            throw new Error('Package name and version are required');
        }
        // check if the package already exists in the database
        const existingPackage = await db.prepare(`SELECT * FROM packages WHERE identifier = ?`).get(`${name}#${version}`) as any;
        if (existingPackage) {
            return existingPackage;
        }
        // create a new package entry in the database
        const newPackage = {
            identifier: `${name}#${version}`,
            process: 'idle',
            status: JSON.stringify({
                downloaded: false,
                extracted: false,
                loaded: false,
                analyzed: false,
                installed: false
            }),
            download: JSON.stringify({
                name,
                version
            }),
            compressedPackage: null,
            storage: null,
            meta: JSON.stringify({
                name,
                version
            }),
            files: null
        };
        // insert the new package into the database
        await db.sql`INSERT INTO packages (identifier, process, status, download, compressedPackage, storage, meta, files) VALUES (${newPackage.identifier}, ${newPackage.process}, ${newPackage.status}, ${newPackage.download}, ${newPackage.compressedPackage}, ${newPackage.storage}, ${newPackage.meta}, ${newPackage.files})`;

        return parseAndValidatePackages([newPackage], ['identifier', 'process', 'status', 'download', 'compressedPackage', 'storage', 'meta'])[0];
    }

    async function getPackages(columns: (keyof Package)[] = ['identifier', 'process', 'status', 'download', 'compressedPackage', 'storage', 'meta']) {
        if (columns.length === 0) {
            throw new Error('At least one column must be specified');
        }

        const selectedColumns = columns.join(', ');
        const packageQuery = db.prepare(`SELECT ${selectedColumns} FROM packages`);
        const existingPackages = await packageQuery.all() as any[];

        return parseAndValidatePackages(existingPackages, columns);
    }

    async function getPackageById(identifier: string, columns: (keyof Package)[] = ['identifier', 'process', 'status', 'download', 'compressedPackage', 'storage', 'meta']) {
        if (!identifier) {
            throw new Error('Package identifier is required');
        }
        if (columns.length === 0) {
            throw new Error('At least one column must be specified');
        }
        if(!columns.includes('identifier')) {
            columns.push('identifier');
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
           key === 'status' || key === 'download' || key === 'compressedPackage' || key === 'storage' || key === 'meta' || key === 'files'
                ? JSON.stringify(pkg[key as keyof Package])
                : pkg[key as keyof Package]
        ) as any;

        const query = `UPDATE packages SET ${updates} WHERE identifier = ?`;
        const stmt = db.prepare(query);
        return stmt.run(...values, identifier);
    }

    /**
     * Set Package process state
     * @param identifier - Package identifier
     * @param process - Package process state
     * @returns {Promise<void>} - Promise that resolves when the package process state is set
     */
    async function setPackageProcess(identifier: string, process: Package['process']) {
        if (!identifier) {
            throw new Error('Package identifier is required');
        }
        if (!process) {
            throw new Error('Package process is required');
        }
        const query = `UPDATE packages SET process = ? WHERE identifier = ?`;
        const stmt = db.prepare(query);
        return stmt.run(process, identifier);
    }

    /**
     * Update package status and return the new status -> use defu to merge the new status with the existing status
     * @param identifier - Package identifier
     * @param status - Package status
     * @returns {Promise<status>} - Promise that resolves when the package status is updated
     */
    async function setPackageStatus(identifier: string, status: Partial<Package['status']>) : Promise<Package['status']> {
        if (!identifier) {
            throw new Error('Package identifier is required');
        }
        if (!status) {
            throw new Error('Package status is required');
        }
        const existingPackage = await getPackageById(identifier, ['status']);
        const newStatus = { ...existingPackage.status, ...status };
        await updatePackage(identifier, { status: newStatus });
        return newStatus;
    }

    return {
        getPackages,
        getPackageById,
        addDownloadPackage,
        setPackageProcess,
        setPackageStatus,
        updatePackage,
        initDatabase
    };
}