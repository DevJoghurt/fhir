import { defu } from 'defu';
import type { Package } from '#fhirtypes/profiling' 

type RuntimePackageStore = Record<string, Partial<Package>>;

let runtimePackageStore = {} as RuntimePackageStore;

export const usePackageStore = () => {

    function getRuntimePackageStore() : RuntimePackageStore {
        return runtimePackageStore;
    }
    function setRuntimePackageStore(name: string, packageLink: Partial<Package>) : void {
        runtimePackageStore = defu(runtimePackageStore, {
            [name]: packageLink
        });
    }
    
    return {
        getRuntimePackageStore,
        setRuntimePackageStore,
    };
}   